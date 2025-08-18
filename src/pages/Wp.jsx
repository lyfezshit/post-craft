import React from "react";


const mkvButton = ({ text, href }) => `<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${href}" target="_blank" rel="noreferrer noopener nofollow">${text}</a></div>`;
const isSeries = (t) => t === "tv";
const buildMarkup = ({
    title,
    year,
    type,
    posterURL,
    trailerURL,
    driveLinks,
}) => {
    const series = isSeries(type);
    

    const quickInfo = `<!-- wp:columns {"className":"quick_info"} -->
            <div class="wp-block-columns quick_info">
            <div class="wp-block-column" style="flex-basis:33.33%">
                <!-- wp:image {"id":262,"width":"250px","sizeSlug":"full","linkDestination":"none","align":"center"} -->
                <figure class="wp-block-image aligncenter size-full is-resized">
                <img src="${posterURL}" alt="${title}" class="wp-image-262" style="width:250px"/>
                </figure>
                <!-- /wp:image -->
            </div>

            <div class="wp-block-column" style="flex-basis:66.66%">
                <!-- wp:heading --><h2 class="wp-block-heading">${title} (${year})</h2><!-- /wp:heading -->
                <!-- wp:list -->
                <ul class="wp-block-list">
                <li><strong>Title</strong>: ${title}</li>
                <li><strong>Original title</strong>: </li>
                ${series ? `<li><strong>Season</strong>: 1</li><li><strong>Episodes</strong>: ${driveLinks.length}</li>` : `<li><strong>Duration</strong>: 1hr 0min</li>`}
                <li><strong>Genre</strong>: </li>
                <li><strong>Language</strong>: </li>
                <li><strong>Subtitle</strong>: Yes</li>
                <li><strong>Format</strong>: MKV</li>
                </ul>
                <!-- /wp:list -->
            </div>
            </div>
            <!-- /wp:columns -->`;
    
    const buttons = driveLinks.map((l) => mkvButton({ text: l.label || l.quality, href: l.url })).join("");

    const accordion = `<!-- wp:shortcode -->
        [su_accordion]
        [su_spoiler class="file-spoiler" title="Download Links" open="yes" icon="arrow" style="fancy"]
        <!-- /wp:shortcode -->

        <!-- wp:heading {"textAlign":"center","className":"btn_head"} -->
        <h2 class="wp-block-heading has-text-align-center btn_head">${series ? "Season 1 (E01 Added)" : ""
        } {Hindi-Korean}</h2>
        <!-- /wp:heading -->

        <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center","orientation":"vertical"}} -->
        <div class="wp-block-buttons">${buttons}</div>
        <!-- /wp:buttons -->

        <!-- wp:shortcode -->
        [/su_spoiler]
        [su_spoiler class="details-spoiler" title="Details" icon="plus" style="fancy"]
        <!-- /wp:shortcode -->

        <!-- wp:heading --><h2 class="wp-block-heading">Details</h2><!-- /wp:heading -->

        <!-- wp:list -->
        <ul class="wp-block-list">
        <li>https://www.imdb.com/title/XXXX</li>
        <li>https://www.themoviedb.org/${tmdbType}/XXXX</li>
        </ul>
        <!-- /wp:list -->

        <!-- wp:paragraph -->
        <p>DramaDrip is the best Korean ${series ? "Drama" : "Movie"
        } website …</p>
        <!-- /wp:paragraph -->

        <!-- wp:shortcode -->
        [/su_spoiler]
        [/su_accordion]
        <!-- /wp:shortcode -->`;
    
    const trailer = trailerURL && trailerURL.includes("youtube") ? `<!-- wp:embed {"url":"${trailerURL}","type":"video","providerNameSlug":"youtube","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
            <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
            <div class="wp-block-embed__wrapper">${trailerURL}</div>
            </figure>
            <!-- /wp:embed -->`
        : "";

    return `${quickInfo}
            <!-- wp:heading {"textAlign":"center","className":"dl_head"} -->
            <h2 class="wp-block-heading has-text-align-center dl_head" id="dl_head">Download ${title} ${series ? "(Season1)" : ""
        } [Hindi-Korean] Esubs 720p, 1080p Web-Dl</h2>
            <!-- /wp:heading -->
            ${accordion}${trailer}`;
            



};

const  WordpressPost=({ data })=>{
    const markup = buildMarkup(data);

        return (
                    <div className="relative flex max-w-full flex-col gap-3">
                        <div className="max-h-[900px] w-full overflow-y-auto">
                        <pre
                            className="whitespace-pre-wrap bg-white/80 p-5 text-sm text-black"
                            dangerouslySetInnerHTML={{ __html: markup }}
                            />
                        </div>

                        <div className="absolute right-2 top-2">
                            
                        </div>
                        </div>
                );
};

export default WordpressPost;