import { useEffect, useRef, useState } from 'react'

import './App.css'
import PassageBox from './components/PassageBox/PassageBox'

export interface Passage {
  TextContent: string,
  ImageContent?: string,
  Actions: {
    IDs: string[],
    TextContent: string[]
  }
}
const BLANK_PASSAGE: Passage = {
  TextContent: 'BLANK_PASSAGE',
  Actions: {
    IDs: ['BLANK_ID'],
    TextContent: ['BLANK_OPTION']
  }
}

function App() {
  /**
   * TODO
   * Passage Lockout: scrolling up currently allows you to re click old options. Lock in options and never let go.
   * Journal Flags
   * Text Flair Support
   */

  const [allPassages, setAllPassages] = useState<Map<string, Passage>>(new Map<string, Passage>())
  const [displayedPassages, setDisplayedPassages] = useState<Passage[]>([])
  const [fileLoaded, setFileLoaded] = useState(false)

  const loadPassageJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { return; }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const json = JSON.parse(result)
        // console.log(json);

        const allPassages = new Map<string, Passage>()
        //DO STUFF with my JSON
        Object.entries(json).forEach((id_passage_pair) => {
          const pid = id_passage_pair[0];
          const dat: Passage = id_passage_pair[1] as Passage;
          // console.log('pid:',pid, " dat:", dat);
          allPassages.set(pid, dat)
        })

        setAllPassages(allPassages)
        setFileLoaded(true)
      } catch (error) {
        console.error('Failed to read JSON:', error);
      }
    }
    reader.readAsText(file);
  }

  const addPassage = (passageID: string) => {
    const nextPassage = allPassages.get(passageID)
    if (!nextPassage) {
      console.log(`couldnt find passageID [${passageID}]`);
      setDisplayedPassages([...displayedPassages, BLANK_PASSAGE]);
      return
    }
    setDisplayedPassages([...displayedPassages, nextPassage])
  }

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedPassages]);

  return (
    <>
      <input type='file' accept='.json' onChange={loadPassageJSON}></input>
      <div>
        <p>
          We're writing a visual novel. We also need a journal system
        </p>
        <p>
          Paragraphs:
          holds paragraph content, image content, actions/options content.
        </p>

        <p>
          ## Block Text Display System
          How large should each box be? Mobile friendly as well? Needs to be able to generate from the input text example file style.
        </p>

        <p>
          ## JOURNAL SYSTEM: Modal and sidebar button. Easy. Can be created separately. Maybe should go last?
          - Needs a global flag state system. Perhaps we can use setState {`( (prevState)=>{return {...prevState}.addNewFlag})`} to keep
          track of flags in the journal
        </p>
        <div>
          <p>
            Hello I am the master parent
          </p>
          {fileLoaded && <button onClick={() => { addPassage('entry') }}> START!!!</button>}
          {displayedPassages.map((passageData, index) => (
            <>
              <PassageBox passageData={passageData} addPassage={addPassage} index={index}></PassageBox>
            </>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>
    </>
  )
}

export default App
