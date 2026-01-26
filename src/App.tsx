import { useEffect, useRef, useState } from 'react'

import './App.css'

interface Passage {
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
  // const [count, setCount] = useState(0)
  /**
   * TODO
   * Passage Lockout: scrolling up currently allows you to re click old options. Lock in options and never let go.
   */
  // const [jsonData, setJsonData] = useState<>(null)

  // const entrypointKey = '0'
  // allPassages.set(entrypointKey, { TextContent: 'This is my entry point passage', Actions: ['1', '2', '3'] })
  // allPassages.set('1', { TextContent: 'Passage One', Actions: ['1', '2', '3'] })
  // allPassages.set('2', { TextContent: 'OOH baby you chose passage 2', Actions: ['1', '2', '3'] })
  // allPassages.set('3', { TextContent: 'Yum yum passage 3', Actions: ['1', '2', '3'] })

  const [allPassages, setAllPassages] = useState<Map<string, Passage>>(new Map<string, Passage>())
  const [displayedPassages, setDisplayedPassages] = useState<Passage[]>([])

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
        // setJsonData(json);
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
        What the hell do I even have to do?

        We're writing a visual novel. We also need a journal system


        Paragraphs:
        holds paragraph content, image content, actions/options content.
        All stored in a Map. Actions have text and the key to next paragraph


        ## Block Text Display System
        How large should each box be? Mobile friendly as well? Needs to be able to generate from the input text example file style.
        HOW DO I EVEN GENERATE A NEW DIV AT THE BOTTOM?



        ## JOURNAL SYSTEM: Modal and sidebar button. Easy. Can be created separately. Maybe should go last?
        - Needs a global flag state system. Perhaps we can use setState {`( (prevState)=>{return {...prevState}.addNewFlag})`} to keep
        track of flags in the journal

        <div>
          Hello I am the master parent
          <button onClick={() => { addPassage('entry') }}> clikc to have babies</button>
          {displayedPassages.map((passageData, index) => (
            <div key={index} style={{ position: 'relative', margin: '50px', height: 500, border: 'solid 2px white' }}>
              <div>{passageData.TextContent}</div>
              <div style={{ position: 'absolute', bottom: '0%' }}>
                {
                  passageData.Actions.IDs.map((id, index) => (
                    <button onClick={() => { addPassage(id) }}> {passageData.Actions.TextContent[index]}</button>
                  ))
                }
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>
    </>
  )
}

export default App
