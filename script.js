Window.this.isResizable = false;
Window.this.isMaximizable = false;

import {
	checkIfProgramInPath,
	isWindows,
	checkFundamentalDependencies
} from "./utils";

import {
	videoFileDialog,
	ffmpegPathDialog,
	mp4editPathDialog,
	removeAllFiles,
	scriptPathDialog,
	metadataFolderPathDialog,
	convert
} from "./ui";

import * as env from "@env";

// Register event listeners
document.ready = async () => {
	// Check for necessary dependencies
	const ok = await checkFundamentalDependencies();
	if (!ok) {
		const element = isWindows ? "PowerShell" : "Bash";
		const attrs = [];
		attrs["caption"] = `${element} not found`;
		Window.this.modal(
			<error {...attrs}>
				Dependencies check failed. Ensure you have {element} installed.
			</error>);
		Window.this.close();
		return;
	}

	// Check if the dependencies are already in the system path
	const ffmpegPath = await checkIfProgramInPath("ffmpeg");
	if (ffmpegPath) {
		const ffmpegPathElement = document.getElementById("ffmpegPath");
		ffmpegPathElement.value = ffmpegPath;
	}

	const mp4editPath = await checkIfProgramInPath("mp4edit");
	if (mp4editPath) {
		const mp4editPathElement = document.getElementById("mp4editPath");
		mp4editPathElement.value = mp4editPath;
	}

	// Add event listeners to buttons
	document.getElementById("addFileButton").onclick = videoFileDialog;
	document.getElementById("removeAllFilesButton").onclick = removeAllFiles;
	document.getElementById("ffmpegPathButton").onclick = ffmpegPathDialog;
	document.getElementById("mp4editPathButton").onclick = mp4editPathDialog;
	document.getElementById("scriptPathButton").onclick = scriptPathDialog;
	document.getElementById("metadataFolderPathButton").onclick = metadataFolderPathDialog;
	document.getElementById("convertButton").onclick = convert;
};