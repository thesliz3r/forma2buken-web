const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Enable CORS for frontend requests
app.use(cors());

// Serve static files from "public" and "results" folders
app.use(express.static('public'));
app.use(express.static('results'));

// Multer Configuration for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Handle file uploads and processing
app.post('/upload', upload.array('files'), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send("No files uploaded.");
        }

        const processedFileName = `Processed_${Date.now()}.xlsx`;
        const processedFilePath = path.join(__dirname, 'results', processedFileName);

        const workbook = xlsx.utils.book_new();
        const data = [];

        // Process Excel files
        files.forEach((file) => {
            const filePath = file.path;
            if (path.extname(file.originalname) === ".xlsx" || path.extname(file.originalname) === ".xls") {
                const excelData = xlsx.readFile(filePath);
                const sheetNames = excelData.SheetNames;

                sheetNames.forEach((sheetName) => {
                    const sheetData = xlsx.utils.sheet_to_json(excelData.Sheets[sheetName]);
                    data.push(...sheetData);
                });
            }
        });

        const newSheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, newSheet, "ProcessedData");
        xlsx.writeFile(workbook, processedFilePath);

        res.status(200).json({ 
            message: "Files uploaded and processed successfully!", 
            downloadLink: `/results/${processedFileName}` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing files.");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
