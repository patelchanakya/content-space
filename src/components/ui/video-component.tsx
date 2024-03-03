import React from 'react';

interface VideoComponentProps {
    videoUrl: string;
}

const VideoComponent: React.FC<VideoComponentProps> = ({ videoUrl }) => {
    const videoId = videoUrl.split('v=')[1];
    const src = `https://www.youtube.com/embed/${videoId}`;

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
