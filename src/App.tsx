import { useEffect, useRef, useState } from 'react'
import './App.css'
import PassageBox from './components/PassageBox/PassageBox'
import Journal from './components/Journal/Journal'

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
   * Passage Event System ? what does this even mean? Sound triggers. visual triggers. Timer triggers? Events should be on Passage Load.
   * replace Map usage with Record<T,T>()
   */

  const [allPassages, setAllPassages] = useState<Map<string, Passage>>(new Map<string, Passage>())
  const [textTagMap, setTextTagMap] = useState<Map<string, Object>>(new Map<string, Object>())
  const [journalEntries, setJournalEntries] = useState<Record<string, Record<string, string>>>({})
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

  /**
   * if we ever make a custom file format (for bundling audio img etc, still use this function im sure we can select multiple files too.)
   * 
   * on that note, maybe we can make a resource map, e.g. "music.mp3" maps to the file music.mp3, and the config json for events simply tries to access resourcemap["music.mp3"]
   */
  const loadPassageJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { return; }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const json = JSON.parse(result)
        const allPassages = new Map<string, Passage>()
        // Process the JSON

        Object.entries(json).forEach((id_data_pair) => {
          const id = id_data_pair[0]
          const data = id_data_pair[1]
          if (id.startsWith('__')) {
            /**
             * Special Cases flagged by double underscore '__':
             * __TextTags
             */
            const tagMap = new Map<string, Object>()
            Object.entries(data ?? {}).forEach(([key, value]) => {
              tagMap.set(key, value as Object)
            })
            setTextTagMap(tagMap);
          } else if (id.startsWith('JE_')) {  // Journal Entries
            // Process Journal Entry entries with structure id: {num:Text, num:Text, num:Text...}
            setJournalEntries((prevJournalEntries) => {
              const newJournalEntries = { ...prevJournalEntries }
              newJournalEntries[id] = (data as Record<string, string>)
              console.log('setting journal entries: ', newJournalEntries);
              return newJournalEntries
            })
          } else {  // Otherwise treat as passage
            allPassages.set(id, data as Passage)
          }
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
      <Journal
        journalFlags={journalFlags}
        journalEntries={journalEntries}
        textTagMap={textTagMap}
        ></Journal>
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
