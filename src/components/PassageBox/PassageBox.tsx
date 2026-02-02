import { useState } from "react"
import type { ActionDetail, Passage } from "../../App"
import TextContent from "../TextContent/TextContent"
import { motion } from "motion/react"


interface PassageBoxProps {
    passageData: Passage,
    addPassage: Function,
    setJournalFlags: Function,
    textTagMap: Map<string, Object>,
    index: number,
}


export default function PassageBox(props: PassageBoxProps) {
    const passageData = props.passageData
    const addPassage = props.addPassage
    const setJournalFlags = props.setJournalFlags
    const [lockoutChoices, setLockoutChoices] = useState(false)
    const [choiceIndex, setChoiceIndex] = useState(Infinity)
    return <>
        <motion.div key={props.index} style={{ position: 'relative', margin: '50px', height: 500, border: 'solid 2px white', backgroundColor:'#2e2c28ff'}}
            initial={{opacity:0, y:-50      }}
            animate={{opacity:1, y:0        }}
            transition={{duration:0.5}}
        >
            <div>DEBUG DUPLICATE: {passageData.TextContent}</div>
            <TextContent
                raw={passageData.TextContent}
                textTagMap={props.textTagMap}
            ></TextContent>
            <div style={{ position: 'absolute', bottom: '0%' }}>
                {
                    Object.keys(passageData.Actions).map((id, index) => {
                        const detail: ActionDetail = passageData.Actions[id]
                        return <button
                            style={{ backgroundColor: choiceIndex == index ? '#7e8f20ff' : (lockoutChoices ? '#70707052' : "auto"), pointerEvents: lockoutChoices ? "none" : 'auto' }}
                            onClick={() => {
                                setLockoutChoices(true)
                                setChoiceIndex(index)
                                addPassage(id)
                                setJournalFlags((prevJournalFlags:Record<string,number>)=>{
                                    return {...prevJournalFlags, ...detail.setFlags ?? {}}
                                })
                            }}>
                            <TextContent
                                raw={detail.TextContent}
                                textTagMap={props.textTagMap}
                            ></TextContent>
                        </button>
                    })
                }
            </div>
        </motion.div>



    </>
}