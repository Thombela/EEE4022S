const express = require('express');
const SftpClient = require('ssh2-sftp-client');
const cors = require('cors');
const { server, username, password, port } = require('./constants');
const app = express();
const PORT = 1234;
const multer = require('multer');

const sftp = new SftpClient();
const upload = multer({ dest: 'uploads/' })

// Middleware
app.use(cors());
app.use(express.json());

// FTP server configuration
const sftpConfig = {
    host: server,
    user: username,
    password: password,
    port: port
};

// Connect to HPC server
const connectToSftp = async () => {
    try {
        console.log('Attempting to connect to SFTP server...');
        await sftp.connect(sftpConfig);
        console.log('Successfully connected to SFTP server');
        return sftp;
    } catch (error) {
        console.error('Error connecting to SFTP server:', error);
        throw error;
    }
};
// Download from HPC 
const downloadFile = async (remotePath) => {
    const client = await connectToSftp();
    try {
        await sftp.get(remotePath, localPath);
        console.log(`Downloaded ${remotePath} to ${localPath}`);
    } catch (error) {
        console.error('Download failed:', error);
    }
    await client.end();
};
// Check for folder
const ensureFolderExists = async (remoteFolderPath) => {
    try {
        // Check if the folder exists
        const list = await sftp.list(remoteFolderPath);
        console.log(`Folder ${remoteFolderPath} already exists`);
    } catch (error) {
        // If the folder does not exist, create it
        if (error.code === 2) { // 2 means "No such file or directory"
            await sftp.mkdir(remoteFolderPath, true);
            console.log(`Created folder: ${remoteFolderPath}`);
        } else {
            throw error;
        }
    }
};
// Upload file
const uploadFile = async (remoteFolderPath, fileName) => {
    const client = await connectToSftp();
    const remoteFilePath = `${remoteFolderPath}/${fileName}}`; // Remote file path

    await ensureFolderExists(remoteFolderPath);

    try {
        await sftp.put(fileName, remoteFilePath);
        console.log(`Uploaded ${fileName} to ${remoteFilePath}`);
    } catch (error) {
        console.error('Upload failed:', error);
    }

    await client.end();
};

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const client = await connectToSftp();
        const remotePath = `/remote-folder/${file.originalname}`; // Path on your SFTP server

        // Upload file to the SFTP server
        await client.put(file.path, remotePath);

        // Delete file from local uploads folder after successful upload
        await fs.promises.unlink(file.path);

        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('File upload failed:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Download route (similar structure to what you already have)
app.get('/download/:fileName', async (req, res) => {
    const { fileName } = req.params;

    try {
        const client = await connectToSftp();
        const remoteFilePath = `Models/shoe/${fileName}`;
        const localFilePath = `downloads/${fileName}`; // Where the file will be saved temporarily

        // Download file from SFTP server
        await client.get(remoteFilePath, localFilePath);

        // Send file to client
        res.download(localFilePath, fileName, async (err) => {
            if (err) {
                console.error('Error during download:', err);
                res.status(500).json({ error: 'File download failed' });
            }

            // Delete the file after sending it
            await fs.promises.unlink(localFilePath);
        });
    } catch (error) {
        console.error('File download failed:', error);
        res.status(500).json({ error: 'File download failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
