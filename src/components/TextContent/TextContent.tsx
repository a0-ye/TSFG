import type { ReactElement } from "react";

/**
 * should take in raw text AND text tags. Returns a div with the styles applied to tagged text
 */
interface TextContentProps {
    raw: string,
    tags: Object | undefined
}

/**
 * TODO:
 * Make it work with nested tagging, e.g. [[My Text and one nest [[Here](nestTag)] and it is cool](outerTag)]
 * 
 * Possible bugs:
 *  Unverified RegEx. can it handle in-line square brackets [] not part of tagging?
 * 
 */
export default function TextContent(props: TextContentProps) {
    const raw = props.raw
    const tags = props.tags // should be an object as many tag:cssStyleObject
    if (!tags) {
        // return <span>{raw}</span> 
    } // return when no tags DOES NOTHING FOR NOW
    const tagMap = new Map<string, Object>()
    Object.entries(tags ?? {}).forEach(([key, value]) => {
        tagMap.set(key, value as Object)
    })

    const splitRaw = raw.split(/(\[\[.*?\]\(.*?\)])/).filter(Boolean);
    const divList: ReactElement[] = []
    splitRaw.forEach((str, idx) => {
        if (str.startsWith('[[') && str.endsWith(']')) {
            const content_tag_pair = str.split(/\[\[(.*?)\]\((.*?)\)\]/).filter(Boolean)
            // separate into the raw text and the tagID
            console.log(content_tag_pair);
            divList.push(
                <span
                    key={idx}
                    style={{whiteSpace:'pre-wrap', ...tagMap.get(content_tag_pair[1])}}
                >{content_tag_pair[0]}</span>
            )
        } else {
            divList.push(
                <span
                    key={idx}
                    style={{ whiteSpace: 'pre-wrap' }}
                >{str}</span>
            )
        }
    })

    return divList

}