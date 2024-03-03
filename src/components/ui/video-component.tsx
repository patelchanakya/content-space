import React from 'react';

interface VideoComponentProps {
    videoUrl: string;
}

const VideoComponent: React.FC<VideoComponentProps> = ({ videoUrl }) => {
    const videoIdMatch = videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    const src = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    return (
        <iframe
            src={src}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
        ></iframe>
    );
};

export default VideoComponent;
