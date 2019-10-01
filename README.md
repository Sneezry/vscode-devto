# VS Code DEV Community Extension

[DEV Community](https://dev.to) post editor for VS Code.

## Features

- Allow you to sign in DEV Community and list all your posts
- Edit your posts and save online
- View post online
- Upload images to GitHub and quickly insert image URL into markdown file

## Sign in

- Open DEV Community treeview
- Click `Create API key` or the key icon at top right corner of the view
- Generate a new API key or select an existing key
- Click `Sign in` or the sign in icon at top right corner of the view
- Paste API key and press enter
- Your post list will be shown in seconds

## Edit a post

- Click a post title to open markdown content in VS Code editor
- Edit as a normal markdown file

## Save post

- Use VS Code `save` commnad to save post online. Press `Ctrl` + `S` as hotkey

## Create a new post

- Click `plus` icon at top right corner of the view
- Edit the untitled post and press `Ctrl` + `S` to save it

## Publish/Unpublish a post

- Click to open the post
- Modify `publish` property in yaml meta section at the top of the post
- Press `Ctrl` + `S` to save publish state

You can also right click unpublished post in the list, and click `Publish` to quickly publish the post.

## Delete a post

- Right click the post in post list
- Click `Delete post online` to delete the post in browser
- Click `refresh` icon at top right corner of the view to refresh post list

## Preview a post in local

- Press `Ctrl` + `Shift` + `V` to preview locally
- Or press `Ctrl` + `K` `V` if you prefer side by side preview

## Upload images

- Open or create a post
- Click `Upload images` on bottom left cornor of VS Code
- Paste your GitHub personal access token if you haven't set

You can generate new GitHub personal access token from <https://github.com/settings/tokens>. Click `Generate new token`, and check `repo` scope.

You can also find serval VS Code extensions to allow you to upload file online, such as [Azure Storage](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestorage).

## License

This extension is published under MIT license.