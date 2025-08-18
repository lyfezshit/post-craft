export const byteFileSize = (bytes) => {
    if (!bytes) return "0  B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (
        (bytes / Math.pow(1024, i).toFixed(1)) * 1 + " " + ["B", "KB", "MB", "GB", "TB"][i]
           
    );
    
}