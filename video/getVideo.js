const videos = ["mov", "mp4", "webm"];

async function loadVideos() {
    const posts = await api.getPosts({ useLastSeenGlobal: false, useLastSeenFollowed: false });
    posts["globalPosts"].forEach(post => {
        // console.log(post)
        const attachment = post.attachments[0];
        if (!attachment) {
            return;
        }
        const parts = attachment.split(".");
        const ext = parts[parts.length - 1];
        if (videos.indexOf(ext) != -1) {
            // console.log(attachment)
            videoBlock(attachment, post);
        }
    });
}

function videoBlock(videoUrl, post) {
    const videoCard = document.createElement("span");
    videoCard.setAttribute("class", "videoCard");
    const video = document.createElement("video");
    video.setAttribute("src", videoUrl);
    const title = document.createElement("span");
    title.textContent = post.title;
    videoCard.append(video, title);
    document.getElementById("videoList").appendChild(videoCard);
}

loadVideos();