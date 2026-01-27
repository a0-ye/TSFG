import { useState } from "react"
import type { ActionDetail, Passage } from "../../App"
import TextContent from "../TextContent/TextContent"

interface PassageBoxProps {
    passageData: Passage,
    addPassage: Function,
    index: number,
}


export default function PassageBox(props: PassageBoxProps) {
    const passageData = props.passageData
    const addPassage = props.addPassage
    const [lockoutChoices, setLockoutChoices] = useState(false)
    const [choiceIndex, setChoiceIndex] = useState(Infinity)
    return <>

        <div key={props.index} style={{ position: 'relative', margin: '50px', height: 500, border: 'solid 2px white' }}>
            <div>DEBUG DUPLICATE: {passageData.TextContent}</div>
            <TextContent
                raw={passageData.TextContent}
                tags={passageData.TextTags}
            ></TextContent>
            <div style={{ position: 'absolute', bottom: '0%' }}>
                {
                    Object.keys(passageData.Actions).map((id, index) => {
                        const detail:ActionDetail = passageData.Actions[id]
                        return <button
                            style={{ backgroundColor: choiceIndex == index ? '#7e8f20ff' : (lockoutChoices ? '#70707052' : "auto"), pointerEvents: lockoutChoices ? "none" : 'auto' }}
                            onClick={() => {
                                setLockoutChoices(true)
                                setChoiceIndex(index)
                                addPassage(id)
                            }}>
                                <TextContent
                                    raw={detail.TextContent}
                                    tags={passageData.TextTags}
                                ></TextContent>
                            </button>
                    })
                    // passageData.Actions.IDs.map((id, index) => (
                    //     <button
                    //         style={{ backgroundColor: choiceIndex == index ? '#7e8f20ff' : (lockoutChoices ? '#70707052' : "auto"), pointerEvents: lockoutChoices ? "none" : 'auto' }}
                    //         onClick={() => {
                    //             setLockoutChoices(true)
                    //             setChoiceIndex(index)
                    //             addPassage(id)
                    //         }}>{passageData.Actions.TextContent[index]}</button>
                    // ))
                }
            </div>
        </div>



    </>
}