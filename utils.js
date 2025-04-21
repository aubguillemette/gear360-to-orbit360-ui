import * as env from "@env";
import * as sys from "@sys";
import * as sciter from "@sciter";
import config from "./config.js";

const isWindows = env.PLATFORM === "Windows";
const isMac = env.PLATFORM === "OSX";
const isLinux = env.PLATFORM === "Linux";
const isAndroid = env.PLATFORM === "Android";
const isNix = isMac || isLinux || isAndroid;

const newline = isWindows ? "\r\n" : "\n";

const buffers = [];
function newStringBuffer(name) {
    buffers[name] = "";
}
function getStringBuffer(name) {
    if (buffers[name] === undefined) return newStringBuffer(name);
    return buffers[name];
}
function appendToStringBuffer(name, str) {
    if (buffers[name] === undefined) throw new Error(`Buffer ${name} not found`);
    buffers[name] += str;
}

function formatUri(uri) {
	const noPrefix = uri.replace(/^file:\/+/, "");
	const normalized = decodeURI(noPrefix);
	if (!isWindows) return normalized;

	const convertToBackslashes = normalized.replace(/\//g, "\\");
	return convertToBackslashes;
}

async function checkIfProgramInPath(programName) {
	let command = "";
	let args = "";

	if (isWindows) {
		command = "powershell"
		args = `(Get-Command ${programName} -ErrorAction SilentlyContinue).Path`;
	};

	if (isNix) {
		command = "which"
		args = programName;
	}
	
	if (command === "" || args === "") return undefined;

    newStringBuffer("stdout");
    newStringBuffer("stderr");

	const process = sys.spawn([command, args], { stdout: "pipe", stderr: "pipe" });
	pipeReader(process.stdout, (txt) => { appendToStringBuffer("stdout", txt); });
	pipeReader(process.stderr, (txt) => { appendToStringBuffer("stderr", txt); });
	const resp = await process.wait();

	if (resp.exitCode !== 0 || resp.exit_status !== 0) {
		console.error(`Error: ${resp.exitCode} ${resp.exit_status}`);
		console.error("stderr: ", getStringBuffer("stderr"));
		return undefined;
	}

    // Expecting the output to be a single line with the path to the program
    const stdOutBuffer = getStringBuffer("stdout");
	if (stdOutBuffer.length <= 0) return undefined;
    
    const output = stdOutBuffer.split(newline).filter(line => line.trim() !== "");
    if (output.length <= 0) return undefined; // wtf?
    return output[0];
}

// Probably overkill
async function checkFundamentalDependencies() {
    let command = null;
    if (isWindows) {
        command = ["powershell", "exit"];
    }
    else {
        command = ["bash", "-c", "exit"];
    }
    
    try {
        const process = sys.spawn(command);
        const resp = await process.wait();
        // I have no idea which one should be used
        return resp.exitCode === 0 && resp.exit_status === 0;
    }
    catch (e) {
        console.log(command[0], e);
        return false;
    }
}

async function pipeReader(pipe, fn) {
	try {
		let data = "";
		reading: while (pipe) {
			let text = await pipe.read();
			text = sciter.decode(text);
			while (text) {
				const newlinePos = text.indexOf(newline);
				if (newlinePos < 0) { data += text; continue reading; }
				data += text.substr(0, newlinePos);
				text = text.substr(newlinePos + newline.length);
				fn(data);
				data = "";
			}
		}
	} catch (e) {
		console.error("Error reading pipe: ", e);
	}
}

function startConvert(ffmpegPath, mp4editPath, scriptPath, metadataFolderPath, filepath) {
    let command = "";
    if (isWindows) {
        env.exec("powershell", "-noexit", "-executionpolicy", "bypass", "-file", scriptPath, "-input_file", filepath, "-metadata_dir_path", metadataFolderPath, "-ffmpeg_path", ffmpegPath, "-mp4edit_path", mp4editPath);
    } else {
        command = `bash -e ${scriptPath} -i "${filepath}" -m "${metadataFolderPath}" -f "${ffmpegPath}" -p "${mp4editPath}"`;
    }
    env.launch(command);
}

export{
    formatUri,
    checkIfProgramInPath,
    pipeReader,
    checkFundamentalDependencies,
    startConvert,
    isWindows,
    isNix,
    newline
};