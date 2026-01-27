import { useEffect, useRef, useState } from 'react'
import './App.css'
import PassageBox from './components/PassageBox/PassageBox'

export interface ActionDetail {
  TextContent: string,
  setFlags?: Record<string, number>,
  // defaultFlag?: boolean,
}

export interface Passage {
  TextContent: string,
  TextTags?: Record<string, Object>,
  ImageContent?: string,
  Actions: Record<string, ActionDetail>
}
const BLANK_PASSAGE: Passage = {
  TextContent: 'BLANK_PASSAGE',
  Actions: {
    "entry": { TextContent: 'BLANK_PASSAGE_TEXT. LOOP TO ENTRY' }
  }
}

function App() {
  /**
   * TODO:
   * Passage Event System ? what does this even mean? Sound triggers. visual triggers. Timer triggers?
   * Journal Flags
   */

  const [allPassages, setAllPassages] = useState<Map<string, Passage>>(new Map<string, Passage>())
  const [textTagMap, setTextTagMap] = useState<Map<string, Object>>(new Map<string, Object>())
  const [displayedPassages, setDisplayedPassages] = useState<Passage[]>([])
  const [fileLoaded, setFileLoaded] = useState(false)


  /**
   * Main Game Logic:
   * 
   * Journal Flags are arbitrarily named flags/tags that get added to the global journalFlags object. These unlock journal entries in the journal IFF there exists an entry matching that flag
   * Flags get added when an action is taken, thus 
   * 
   * e.g. flags: goblin1, goblin2, goblin3, buttlicker
   * If we write journal entries for goblin1, goblin2, goblin3, in the journal, we should see those entries populate the journal.
   * Because buttlicker has no journal entry, nothing will show up and nothing will happen
   */
  const [journalFlags, setJournalFlags] = useState<Record<string, number>>({})

  const loadPassageJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { return; }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const json = JSON.parse(result)
        const allPassages = new Map<string, Passage>()
        //DO STUFF with my JSON
        Object.entries(json).forEach((id_passage_pair) => {
          if (id_passage_pair[0].startsWith('__')) {
            /**
             * Special Cases flagged by double underscore '__':
             * __TextTags
             */
            const tagMap = new Map<string, Object>()
            Object.entries(id_passage_pair[1] ?? {}).forEach(([key, value]) => {
              tagMap.set(key, value as Object)
            })
            setTextTagMap(tagMap);
          }
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
      <div style={{ position: 'fixed', left: '0%', width: 300, }}>
        {Object.keys(journalFlags).map((key, idx) => {
          return <p key={idx}>
            {key} and {journalFlags[key]}
          </p>
        })}
      </div>
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
              <PassageBox passageData={passageData} addPassage={addPassage} setJournalFlags={setJournalFlags} textTagMap={textTagMap} index={index} ></PassageBox>
            </>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>
    </>
  )
}

export default App
