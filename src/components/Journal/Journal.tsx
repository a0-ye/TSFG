import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface journalProps {
    journalFlags: Record<string, number>,
    journalEntries: Record<string, Record<string, string>>,
    textTagMap: Map<string, Object>,
}


/**
 * Single page of the journal. It should know
 * its id
 * its content
 * its image???
 * and more if needed
 * 
 * We dont keep track of the flag, because we check the flag on render
 */

interface journalPage {
    id: string,
    variants: Record<string, string>
}

/**
 * REQS:
 * remember page when closing
 * 
 * Option to view cover of journal
 * 
 * slide to center of screen, flip open
 *  Drag? easy
 * 
 * Rectangle div in center. Work on instant page toggle for flipping.
 * Animations come later
 * Click to slide on screen come later. Uses pop-in button for now
 * 
 * little bookmarks appear per entry! how cute
 * show variant toggle between entry variants
 * 
 */

export default function Journal(props: journalProps) {
    const [leftPageIdx, setleftPageIdx] = useState(0)
    const journalFlags = props.journalFlags;
    const journalEntries = props.journalEntries;
    const [pages, setPages] = useState<journalPage[]>([])
    const [showJournal, setShowJournal] = useState(false)

    /**
     * on flag change, check every flag for membership in pages
     */
    useEffect(() => {
        console.log('pre-add pages status', pages);
        const currentPagesKeys = new Set(pages.map((page)=>{return page.id}))  // all pages in the journal currently
        const newPageKeys = Object.keys(journalFlags).filter(
            (flag) => {
                console.log('membership test',flag,currentPagesKeys, (!currentPagesKeys.has(flag)) , (flag in journalEntries) );
                
                return (!currentPagesKeys.has(flag)) && (flag in journalEntries)
            }    // sort out only the newly added pages
        )
        // console.log('filtered pagekeys',newPageKeys);
        if (newPageKeys.length > 0) {
            const newEntries = newPageKeys.map((key) => {
                const createdPage = {
                    id: key,
                    variants: journalEntries[key]
                }
                console.log(`Adding ${key} to journal entries`);
                console.log(createdPage);
                return createdPage
            })

            setPages(prevPages => [...prevPages, ...newEntries])
        }
    }, [journalFlags])

    const nextPage = () => {
        setleftPageIdx((currentLeftPageIdx) => {
            //activePageIdx == length-1 means we are at the back cover. Do not increment
            return currentLeftPageIdx + 2 >= pages.length ? currentLeftPageIdx : currentLeftPageIdx + 2
        })
    }
    const prevPage = () => {
        setleftPageIdx((currentLeftPageIdx) => {
            // == 0 means front cover. dont decrement
            return currentLeftPageIdx - 2 < 0 ? currentLeftPageIdx : currentLeftPageIdx - 2
        })
    }

    return <>
        {/** perhaps there should be a collision box? needs to be big enough such that the offset to the visual wont affect selection on the hover animation yk? like 
         * it displaces 100px to the right, that animation can possibly move it off the mouse, thus un-hovering it
         */}
        <motion.div 
            id="journal-toggle-collision"
            style={{position:'fixed',
                bottom:'15%',
                width:500,height:700,
                x:-300,
                y:0,
                rotate:15,
            }}
            whileHover={{
                x:0,
                y:0,
                rotate:5,
            }}
            onClick={() => { setShowJournal((prevShowJournal) => (!prevShowJournal)) }}
        >
            <div 
                id='journal-visuals'
                style={{
                width:450,height:650, 
                backgroundColor:'#635337ff',
                border:'solid 2px black'
            }}
            >

            </div>
            
        </motion.div>
        <div style={{ position: "fixed", left: '0%', top: '0%' }}>
            <button onClick={() => { setShowJournal((prevShowJournal) => (!prevShowJournal)) }}
            // style={{ position: "fixed", left: '0%', top: '0%' }}
            >
                toggle journal
            </button>
            {Object.keys(journalFlags).map((key, idx) => {
                return <p key={idx}>
                    {key} and {journalFlags[key]}
                </p>
            })}
        </div>
        {showJournal && <div style={{
            position: 'fixed', left: '50%', top: '25%', translate: '-50% 0',
            backgroundColor: "#755d3dff", zIndex: 1
        }}>
            <div style={{
                display: "flex"
            }}>
                <div style={{ border: 'solid black 2px', backgroundColor: '#44433aff', margin: 5, width: 650, height: 600 }}>
                    something should be here
                </div>
                <div style={{ border: 'solid black 2px', backgroundColor: '#44433aff', margin: 5, width: 650, height: 600 }}>
                                    something should be here
                </div>
            </div>
            <div> {leftPageIdx} </div>
            <button onClick={prevPage}> prev page </button>
            <button onClick={nextPage}> next page </button>

        </div>}
    </>
}