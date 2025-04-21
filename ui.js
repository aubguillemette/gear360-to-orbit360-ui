import { formatUri, isWindows, startConvert } from "./utils.js";
import config from "./config.js";

function addFile(path) {
    const div = document.createElement("div");
    div.className = "file";

    const fileName = document.createElement("span");
    fileName.className = "fileName";
    fileName.innerText = path;

    const removeButton = document.createElement("button");
    removeButton.className = "removeButton";
    removeButton.innerText = "Remove";
    removeButton.onclick = () => removeFile(div);

    div.appendChild(fileName);
    div.appendChild(removeButton);
    document.getElementById("fileList").appendChild(div);

    hideNoFileBanner();
}

function removeFile(div) {
    div.remove();
    checkFileListEmpty();
}

function hideNoFileBanner() {
    const noFileBanner = document.getElementById("noFile");
    noFileBanner.style.display = "none";
}

function showNoFileBanner() {
    const noFileBanner = document.getElementById("noFile");
    noFileBanner.style.display = "block";
}

function checkFileListEmpty() {
    const files = document.getElementsByClassName("file");
    if (files.length === 0) {
        showNoFileBanner();
        return;
    }
    hideNoFileBanner();
}

function removeAllFiles() {
    const files = document.getElementsByClassName("file");
    files.forEach(div => div.remove());
    showNoFileBanner();
}

function ffmpegPathDialog() {
    const filename = (isWindows) ? "ffmpeg.exe" : "ffmpeg";
    const formattedPath = openFileDialog(filename);
    if (!formattedPath) return;
    const ffmpegPathElement = document.getElementById("ffmpegPath");
    ffmpegPathElement.value = formattedPath;
}

function mp4editPathDialog() {
    const filename = (isWindows) ? "mp4edit.exe" : "mp4edit";
    const formattedPath = openFileDialog(filename);
    if (!formattedPath) return;
    const mp4editPathElement = document.getElementById("mp4editPath");
    mp4editPathElement.value = formattedPath;
}

function metadataFolderPathDialog() {
    const path = openFolderDialog();
    if (!path) return;
    const metadataFolderPathElement = document.getElementById("metadataFolderPath");
    metadataFolderPathElement.value = path;
}

function videoFileDialog() {
    const options = {
        mode: "open-multiple",
        filter: `Select mp4 files|*.mp4`,
        extension: "mp4",
        caption: "Select mp4 files"
    }
    // @ts-ignore
    const filePaths = Window.this.selectFile(options);
    if (!filePaths) return;
    
    if (typeof filePaths === "string") { // returns a string if only one file is selected
        const formattedPath = formatUri(filePaths);
        addFile(formattedPath);
        return;
    }

    filePaths.forEach(x => {  // returns an array of strings if multiple files are selected
        const path = formatUri(x);
        addFile(path);
    });
}

function scriptPathDialog() {
    const file = config.videoScriptName;
    const extension = (isWindows) ? config.winScriptExtension : config.nixScriptExtension;
    const filename = `${file}.${extension}`;

    const path = openFileDialog(filename);
    if (!path) return;
    const formattedPath = formatUri(path);
    const scriptPathElement = document.getElementById("scriptPath");
    scriptPathElement.value = formattedPath;
}

function openFileDialog(filename) {
    const options = {
        mode: "open",
        filter: `Select ${filename}|${filename}`,
        caption: `Select ${filename}`
    };

    if (isWindows) {
        const extension = filename.split(".").pop();
        options.extension = extension;
    }

    // @ts-ignore
    const filePath = Window.this.selectFile(options);
    if (!filePath) return;

    const formattedPath = formatUri(filePath);
    return formattedPath;
}

function openFolderDialog() {
    const options = {
        mode: "open",
        caption: "Select folder"
    };
    // @ts-ignore
    const folderPath = Window.this.selectFolder(options);
    if (!folderPath) return;
    const formattedPath = formatUri(folderPath);
    return formattedPath;
}

function convert() {
    const messages = [];

    const ffmpegPathElement = document.getElementById("ffmpegPath");
    const ffmpegPath = ffmpegPathElement.value;
    if (!ffmpegPath) {
        messages.push("FFmpeg path is not set.");
    }

    const mp4editPathElement = document.getElementById("mp4editPath");
    const mp4editPath = mp4editPathElement.value;
    if (!mp4editPath) {
        messages.push("MP4Edit path is not set.");
    }

    const metadataFolderPathElement = document.getElementById("metadataFolderPath");
    const metadataFolderPath = metadataFolderPathElement.value;
    if (!metadataFolderPath) {
        messages.push("Metadata folder path is not set.");
    }

    const scriptPathElement = document.getElementById("scriptPath");
    const scriptPath = scriptPathElement.value;
    if (!scriptPath) {
        messages.push("Script path is not set.");
    }

    const files = document.getElementsByClassName("file");
    if (files.length === 0) {
        messages.push("No files selected.");
    }

    if (messages.length > 0) {
        Window.this.modal(
            <error caption="Errors found">
                {
                    messages.map((msg) => (
                        <div>{msg}</div>
                    ))
                }
            </error>
        );
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const filepath = files[i].getElementsByClassName("fileName")[0].innerText;
        startConvert(ffmpegPath, mp4editPath, scriptPath, metadataFolderPath, filepath);
    }
    Window.this.close();
}

export {
    addFile,
    removeFile,
    removeAllFiles,
    hideNoFileBanner,
    showNoFileBanner,
    checkFileListEmpty,
    ffmpegPathDialog,
    mp4editPathDialog,
    metadataFolderPathDialog,
    videoFileDialog,
    scriptPathDialog,
    convert
}