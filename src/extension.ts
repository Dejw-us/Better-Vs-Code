import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let createFileDisposable = vscode.commands.registerCommand('extension.createFileInCurrentFolder', async () => {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showInformationMessage('No file is currently open.');
      return;
    }

    const currentFilePath = activeEditor.document.uri.fsPath;
    const currentFolderPath = path.dirname(currentFilePath);
    const currentFileExtension = path.extname(currentFilePath); // Get the extension of the current file

    // Ask user for the file name
    const fileName = await vscode.window.showInputBox({
      prompt: 'Enter the file name (e.g., newFile.txt)',
      validateInput: (input) => {
        if (!input.trim()) {
          return 'File name cannot be empty';
        }
        return null;
      }
    });

    if (fileName) {
      // If no extension is provided by the user, append the extension of the current file
      const fileExtension = path.extname(fileName) ? path.extname(fileName) : currentFileExtension;
      const newFilePath = path.join(currentFolderPath, path.basename(fileName, path.extname(fileName)) + fileExtension);

      // Create the new file
      fs.promises.writeFile(newFilePath, '').then(async () => {
        vscode.window.showInformationMessage(`File created at: ${newFilePath}`);

        // Show QuickPick with no input (just selections)
        const open = await vscode.window.showQuickPick(["Yes", "No"], {
          title: "Open file?",
          canPickMany: false, // Disable multiple selection
          placeHolder: "Choose whether to open the file or not" // Optional placeHolder
        });

        if (open === "Yes") {
          const newFileDocument = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(newFileDocument);
        }
      }).catch((err) => {
        vscode.window.showErrorMessage(`Error creating file: ${err.message}`);
      });
    }
  });

  let deleteFileDisposable = vscode.commands.registerCommand('extension.deleteCurrentFile', async () => {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showInformationMessage('No file is currently open.');
      return;
    }

    const currentFilePath = activeEditor.document.uri.fsPath;

    // Confirm the deletion
    const confirmDelete = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: `Are you sure you want to delete the file: ${path.basename(currentFilePath)}?`
    });

    if (confirmDelete === 'Yes') {
      // Delete the file
      fs.promises.unlink(currentFilePath).then(() => {
        vscode.window.showInformationMessage(`File deleted: ${currentFilePath}`);
        vscode.commands.executeCommand("workbench.action.closeActiveEditor"); // Close the editor for the deleted file
      }).catch((err) => {
        vscode.window.showErrorMessage(`Error deleting file: ${err.message}`);
      });
    }
  });

  context.subscriptions.push(createFileDisposable);
  context.subscriptions.push(deleteFileDisposable);
}

export function deactivate() {}
