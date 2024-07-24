import * as path from "path";
import * as fs from "fs";
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

export async function deleteFilesInDirectory(directoryPath: string) {
    try {
        const files = await readdir(directoryPath);

        const deletePromises = files.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            const fileStat = await stat(filePath);

            if (fileStat.isDirectory()) {
                await deleteFilesInDirectory(filePath);
                await rmdir(filePath);
            } else {
                await unlink(filePath);
            }
        });

        await Promise.all(deletePromises);
        console.log(`All files and folders in ${directoryPath} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting files in directory ${directoryPath}:`, error);
        throw error;
    }
}