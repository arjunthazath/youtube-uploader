const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const db = require('./database');
const app = express();
const port = 5000;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file); // Log the file object
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = path.join(__dirname, req.file.path);
  const { title, description, keywords, privacyStatus } = req.body;

  // Ensure the correct file path is passed to the Python script
  const pythonProcess = spawn('python', [
    path.join(__dirname, 'upload_video.py'),
    `--file=${filePath}`,
    `--title=${title}`,
    `--description=${description}`,
    `--keywords=${keywords}`,
    `--privacyStatus=${privacyStatus}`
  ]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      fs.readFile(path.join(__dirname, 'uploads/success.txt'), 'utf8', (err, message) => {
        if (err) {
          console.error('Failed to read success file:', err);
          res.status(500).send('Failed to upload video');
        } else {
          const videoId = message.trim().split(' ')[4]; // Extract video ID from message
          const stmt = db.prepare("INSERT INTO video_details (videoId, title, description, keywords, privacyStatus) VALUES (?, ?, ?, ?, ?)");
          stmt.run(videoId, title, description, keywords, privacyStatus, (err) => {
            if (err) {
              console.error('Failed to store video details:', err);
              res.status(500).send('Failed to store video details');
            } else {
              res.status(200).send('Video uploaded and details stored successfully');
            }
          });
        }
      });
    } else {
      res.status(500).send('Failed to upload video');
    }
  });
});

app.get('/latest-video', (req, res) => {
  db.get("SELECT * FROM video_details ORDER BY upload_date DESC LIMIT 1", (err, row) => {
    if (err) {
      console.error('Failed to fetch latest video details:', err);
      res.status(500).send('Failed to fetch latest video details');
    } else {
      res.json(row);
    }
  });
});

app.post('/approve', async (req, res) => {
  const { videoId, title, description, keywords, privacyStatus } = req.body;

  // Call the change_privacy_status.py script to update the video privacy status
  const pythonProcess = spawn('python', [
    path.join(__dirname, 'change_privacy_status.py'),
    `--videoId=${videoId}`,
    `--title=${title}`,
    `--description=${description}`,
    `--keywords=${keywords}`,
    `--privacyStatus=${privacyStatus}`
  ]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      res.status(200).send('Video privacy status changed successfully');
    } else {
      res.status(500).send('Failed to change video privacy status');
    }
  });
});

app.post('/reject', (req, res) => {
  const { videoId } = req.body;
  
  // Implement the rejection logic here (e.g., remove the video from the database)
  const stmt = db.prepare("DELETE FROM video_details WHERE videoId = ?");
  stmt.run(videoId, (err) => {
    if (err) {
      console.error('Failed to reject video:', err);
      res.status(500).send('Failed to reject video');
    } else {
      res.status(200).send('Video rejected and removed successfully');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
