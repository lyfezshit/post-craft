
import { useState } from "react";
import { Toaster, toast } from "sonner";

export const Home = () => {

    const [searchId, setSearchId] = useState("");
    const [type, setType] = useState("movie");
    const [error, setError] = useState();
    const [fileInfo, setFileInfo] = useState(null);
    const [posters, setPosters] = useState([]);
    const [trailerUrl, setTrailerUrl] = useState("");

    const [quality, setQuality] = useState("");
    const [print, setPrint] = useState("");
    const [audio, setAudio] = useState({ type: "Single", language: "" });
    const [driveLinks, setDriveLinks] = useState([]);
    const [currentDriveLink, setCurrentDriveLink] = useState("");
    const [titleAttributes, setTitleAttributes] = useState({
        resolution: "",
        codec: "",
        extras: [],
    });


    const fetchData = async () => {
        try {
            const res = await fetch(
                `https://api.themoviedb.org/3/${type}/${searchId}?api_key=${import.meta.env.VITE_TMDB_API
                }&language=en-US`
            );
            if (!res.ok) throw new Error(`Failed to fetch ${searchId}`);
            const data = await res.json();
            setFileInfo(data);

            const imgRes = await fetch(
                `https://api.themoviedb.org/3/${type}/${searchId}/images?api_key=${import.meta.env.VITE_TMDB_API
                }`
            );
            if (!imgRes.ok) throw new Error("Failed to fetch posters");
            const imgData = await imgRes.json();
            setPosters(imgData.posters || []);

            const vidRes = await fetch(
                `https://api.themoviedb.org/3/${type}/${searchId}/videos?api_key=${import.meta.env.VITE_TMDB_API
                }&language=en-US`
            );
            if (!vidRes.ok) throw new Error("Failed to fetch videos");
            const vidData = await vidRes.json();
            const trailer = vidData.results?.find(
                (v) => v.type === "Trailer" && v.site === "YouTube"
            );
            setTrailerUrl(
                trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : ""
            );

            setError(null);
        } catch (err) {
            setError(err.message);
            setFileInfo(null);
            setPosters([]);
            setTrailerUrl("");
            toast.error(err.message);
        }
    };



    const extractDriveIdFromUrl = (url) => {

        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/uc\?id=([a-zA-Z0-9_-]+)/);
        if (fileMatch) return { type: "file", id: fileMatch[1] };

        const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (folderMatch) return { type: "folder", id: folderMatch[1] };

        return null;
    };


    const fetchDriveFileMetadata = async (fileId) => {
        const endpoint = `https://www.googleapis.com/drive/v3/files/${fileId}`;
        const res = await fetch(`${endpoint}?key=${import.meta.env.VITE_G_API}&fields=id,name,size,mimeType`);
        if (!res.ok) throw new Error("Google Drive file lookup failed");
        return res.json();
    };


    const fetchDriveFolderFiles = async (folderId) => {
        const endpoint = `https://www.googleapis.com/drive/v3/files`;
        const res = await fetch(
            `${endpoint}?key=${import.meta.env.VITE_G_API}&q='${folderId}'+in+parents&fields=files(id,name,mimeType,size)`
        );
        if (!res.ok) throw new Error("Google Drive folder lookup failed");
        const data = await res.json();
        return data.files || [];
    };


    const parseDriveLink = async (url) => {
        const result = extractDriveIdFromUrl(url);
        if (!result) throw new Error("Unable to parse Drive link");

        if (result.type === "file") {
            const file = await fetchDriveFileMetadata(result.id);
            return [parseFileAttributes(file)];
        }

        if (result.type === "folder") {
            const files = await fetchDriveFolderFiles(result.id);
            return files.map(parseFileAttributes);
        }
    };

    const parseFileAttributes = (file) => {
        let newquality = "Unknown",
            newprint = "Unknown",
            newaudio = "Unknown";

        if (/2160p/i.test(file.name)) newquality = "2160p";
        else if (/1080p/i.test(file.name)) newquality = "1080p";
        else if (/720p/i.test(file.name)) newquality = "720p";

        if (/WEB-DL/i.test(file.name)) newprint = "WEB-DL";
        else if (/Blu-?ray/i.test(file.name)) newprint = "Blu-ray";

        if (/DDP5\.1|AC3|Dual/i.test(file.name)) newaudio = "Dual";
        else if (/English/i.test(file.name)) newaudio = "English";

        return {
            url: `https://drive.google.com/file/d/${file.id}/download`,
            quality: newquality,
            printType: newprint,
            audio: newaudio,
            fileName: file.name,
        };
    };

    const handleAddDriveLink = async () => {
        const trimmed = currentDriveLink.trim();
        if (!trimmed) {
            toast.error("Import Drive Link");
            return;
        }
        try {
            const parsedFiles = await parseDriveLink(trimmed);
            setDriveLinks((prev) => [...prev, ...parsedFiles]);
            setCurrentDriveLink("");
            toast.success(`Added ${parsedFiles.length} file(s)`);
        } catch (err) {
            toast.error(err.message || "Invalid Google Drive link");
        }
    };


    const attributeButtons = (category, options) =>
        options.map((option) => (
            <button
                key={option}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${category === "extras"
                        ? titleAttributes.extras.includes(option)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : titleAttributes[category] === option
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                onClick={() => {
                    if (category === "resolution" || category === "codec") {
                        setTitleAttributes((prev) => ({ ...prev, [category]: option }));
                    } else {
                        const currentExtras = titleAttributes.extras;
                        setTitleAttributes((prev) => ({
                            ...prev,
                            extras: currentExtras.includes(option)
                                ? currentExtras.filter((i) => i !== option)
                                : [...currentExtras, option],
                        }));
                    }
                }}
            >
                {option}
            </button>
        ));

    const downloadPoster = async (filePath) => {
        try {

            const url = `https://image.tmdb.org/t/p/original${filePath}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch Image');

            const blob = await response.blob();

            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = "poster.jpg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            toast.error("Download Failed!")
        };

    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex ">
            < Toaster richColors position="top-right" />

            < section className=" p-5 space-y-8 w-1/2  overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <header className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <h1 className="text-3xl font-bold">Post Builder</h1>


                </header>


                <div className="flex max-w-4 items-center space-x-2 sm:w-auto">
                    <input
                        type="text"
                        placeholder="Enter your ID..."
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="flex-1 p-2 rounded-md bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                        Fetch Data
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="bg-gray-800  p-4 rounded-lg shadow-lg col-span-1 lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">MEDIA INFO</h2>
                        <div className="flex space-x-2 mb-4">
                            <button
                                className={`px-4 py-2 rounded-md font-medium transition-colors ${type === "movie"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                onClick={() => setType("movie")}
                            >
                                Movies
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md font-medium transition-colors ${type === "tv"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                onClick={() => setType("tv")}
                            >
                                Series
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Title</label>
                                <input
                                    type="text"
                                    value={fileInfo ? fileInfo.title || fileInfo.name : "Movie/Series Title"}
                                    
                                    className="w-full p-2 rounded-md bg-gray-700 text-gray-300 border border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Year</label>
                                <input
                                    type="text"
                                    value={
                                        fileInfo
                                            ? (fileInfo.release_date || fileInfo.first_air_date)?.split("-")[0]
                                            : "Year"
                                    }
                                   
                                    className="w-full p-2 rounded-md bg-gray-700 text-gray-300 border border-gray-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1">
                        <h2 className="text-xl font-semibold mb-4">TITLE GENERATOR</h2>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {attributeButtons("resolution", ["2160p", "1080p", "720p"])}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {attributeButtons("codec", ["x264", "HEVC"])}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {attributeButtons("extras", ["REMUX", "HDR", "DV", "ATMOS"])}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">QUALITY</h2>
                        <div className="flex flex-col space-y-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="quality"
                                    value="1080p"
                                    checked={quality === "1080p"}
                                    onChange={(e) => setQuality(e.target.value)}
                                    className="form-radio text-blue-600 bg-gray-700 border-gray-600"
                                />
                                <span className="ml-2">1080p</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="quality"
                                    value="2160p"
                                    checked={quality === "2160p"}
                                    onChange={(e) => setQuality(e.target.value)}
                                    className="form-radio text-blue-600 bg-gray-700 border-gray-600"
                                />
                                <span className="ml-2">2160p</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">PRINT TYPE</h2>
                        <div className="flex flex-col space-y-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="printType"
                                    value="WEB-DL"
                                    checked={print === "WEB-DL"}
                                    onChange={(e) => setPrint(e.target.value)}
                                    className="form-radio text-blue-600 bg-gray-700 border-gray-600"
                                />
                                <span className="ml-2">WEB-DL</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="printType"
                                    value="Blu-ray"
                                    checked={print === "Blu-ray"}
                                    onChange={(e) => setPrint(e.target.value)}
                                    className="form-radio text-blue-600 bg-gray-700 border-gray-600"
                                />
                                <span className="ml-2">Blu-ray</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">AUDIO</h2>
                        <div className="flex  flex-wrap items-center space-x-1">
                            <select
                                value={audio.type}
                                onChange={(e) => setAudio({ ...audio, type: e.target.value })}
                                className="p-2 rounded-md bg-gray-700 mb-1 text-gray-200 border border-gray-600"
                            >
                                <option>Single</option>
                                <option>Dual</option>
                            </select>
                            <input
                                type="text"
                                value={audio.language}
                                onChange={(e) => setAudio({ ...audio, language: e.target.value })}
                                className="flex-1 p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600"
                                placeholder="Language"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
                    <h2 className="text-xl font-semibold mb-4">POSTERS</h2>
                    <div className="flex flex-wrap gap-2">
                        {posters.slice(0, 5).map((poster, idx) => (
                            <div key={idx} className="text-center">
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${poster.file_path}`}
                                    alt={`Poster ${idx + 1}`}
                                    className="object-cover w-32 h-48 mb-2 rounded"
                                />
                                <button
                                    className="bg-blue-600 px-2 py-1 rounded text-white text-xs"
                                    onClick={() => downloadPoster(poster.file_path)}
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 ">
                    <h2 className="text-xl font-semibold mb-4">TRAILER</h2>
                    <input
                        type="text"
                        placeholder="Embed URL"
                        value={trailerUrl}
                        onChange={(e) => setTrailerUrl(e.target.value)}
                        className=" p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">

                    <h2 className="text-xl font-semibold mb-4">FIELDS: {driveLinks.length}</h2>

                </div>
                <div className="space-y-4 max-h-60 ">

                    <div className="flex space-x-2 ">
                        <input
                            type="text"
                            placeholder="File or Folder URL"
                            value={currentDriveLink}
                            onChange={(e) => setCurrentDriveLink(e.target.value)}
                            className="flex-1 w-full p-2 rounded-md bg-gray-700 text-gray-200 border border-gray-600"
                        />
                        <button
                            onClick={handleAddDriveLink}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    {driveLinks.map((link, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between bg-gray-700 p-2 rounded-md"
                        >
                            <span className="text-sm truncate flex-1">{link.fileName}</span>
                            <span className="text-xs text-gray-400 ml-2">
                                {link.quality} • {link.printType} • {link.audio}
                            </span>
                        </div>
                    ))}


                </div>
            </section>

            <section className="w-1/2 p-5 bg-gray-850 sticky top-0 h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="min-h-screen" >

                <div className="mb-5">
                    <h1 className="text-xl font-bold mb-2">TITLE</h1>
                    <input
                    type="text"
                    placeholder="Download XXXX (2025) [Hindi-Korean] Esubs 720p, 1080p Web-Dl"
                    readOnly
                    className="w-full p-2 rounded-md bg-gray-700 text-white text-xl border border-gray-600"
                    />
                    </div>
                    

                <h1 className="text-xl font-bold mb-2 ">Download</h1>
                <div className="bg-white min-h-screen rounded-lg text-black p-4" />
                </div>
             </section>
            


        </div>

    );
};