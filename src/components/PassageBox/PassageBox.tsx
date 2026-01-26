import { useState } from "react"
import type { Passage } from "../../App"

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
            <div>{passageData.TextContent}</div>
            <div style={{ position: 'absolute', bottom: '0%' }}>
                {
                    passageData.Actions.IDs.map((id, index) => (
                        <button
                            style={{ backgroundColor: choiceIndex==index ? '#7e8f20ff' : ( lockoutChoices? '#70707052': "auto"), pointerEvents:lockoutChoices? "none" : 'auto'}}
                            onClick={() => {
                                setLockoutChoices(true)
                                setChoiceIndex(index)
                                addPassage(id)
                            }}>{passageData.Actions.TextContent[index]}</button>
                    ))
                }
            </div>
        </div>



    </>
}