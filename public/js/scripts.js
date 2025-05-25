async function downloadFile(folderId, fileId) {
  try {
    const response = await fetch(`/folder/${folderId}/${fileId}/download`);
    const data = await response.json();
    const link = document.createElement("a");
    link.href = data.url;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download file.");
  }
}

function setupToggleButtons(buttonId, formId, cancelButtonId, otherElementId = null) {
  const button = document.getElementById(buttonId);
  const form = document.getElementById(formId);
  const cancelButton = document.getElementById(cancelButtonId);
  const otherElement = otherElementId ? document.getElementById(otherElementId) : null;

  button.addEventListener("click", () => {
    form.style.display = "inline-flex";
    button.style.display = "none";
    if (otherElement) otherElement.style.display = "none";
  });

  cancelButton.addEventListener("click", () => {
    form.style.display = "none";
    button.style.display = "inline";
    if (otherElement) otherElement.style.display = "inline-flex";
  });
}

setupToggleButtons("rename-btn", "rename-form", "cancel-btn", "folder-name");
setupToggleButtons("create-folder-btn", "create-folder-form", "cancel-create-btn");
setupToggleButtons("upload-file-btn", "upload-file-form", "cancel-upload-btn");
