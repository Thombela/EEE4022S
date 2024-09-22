const express = require('express');
const SftpClient = require('ssh2-sftp-client');
const cors = require('cors');
//const { server, username, password, port } = require('./constants');
const app = express();
const PORT = 1234;

const sftp = new SftpClient();

// Middleware
app.use(cors());
app.use(express.json());

// FTP server configuration
const sftpConfig = {
    host: 'hex.uct.ac.za',
    user: 'ngcmpi002',
    password: 'PWD4LFMPNG2702A',
    port: 22
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


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
