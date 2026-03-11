import { useEffect, useRef, useState } from 'react'
import './App.css'
import PassageBox from './components/PassageBox/PassageBox'
import Journal from './components/Journal/Journal'
import { parseAsync, renderAsync } from 'docx-preview'
import JSZip, { file } from 'jszip'
import DOCXNodeViewer from './components/Debug/DOCXNodeView'


export interface storyNode {
  id: string, // id
  data: string[][], // other rows' content excluding the ID row (very first one)
  rowCount: number, // total number of rows, INCLUDING the id row,
  type: string,
  next: string[],
};

interface jsonNode {
  // TODO: will need other variables, such as flags and delay and such
  id: string, type: string, next: string[]
}

function App() {
  /**
   * TODO:
   * Passage Event System ? what does this even mean? Sound triggers. visual triggers. Timer triggers? Events should be on Passage Load.
   * replace Map usage with Record<T,T>()
   */


  const [displayedPassages, setDisplayedPassages] = useState<string[]>([])  // An array of passage IDs to display
  const addPassage = (passageID: string) => {
    setDisplayedPassages((prevPassages) => {
      return [...prevPassages, passageID]
    })
  }
  const [journalEntries, setJournalEntries] = useState<Record<string, Record<string, string>>>({})  // Entries for journal. Displayed based on journalFlags
  const [journalFlags, setJournalFlags] = useState<Record<string, number>>({})  // Flags for journal. If the flag for a given entry is set, display in journal.
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
  const [passageMap, setPassageMap] = useState(new Map<string, storyNode>()) // A map containing all of the passages as id:node key:val

  /**
   * 
   * Extracts the story data from the zip file, and loads it into the global passageMap
   */
  const loadStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const ghostDiv: HTMLElement = document.createElement('div');  // temp, used to extract the story content from docx
    const file = event.target.files?.[0];
    if (!file) { return; }
    try {
      // Extract json and docx from zip
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.filter((path, _) => path.endsWith(".json"))[0];
      const jsonData = jsonFile ? await jsonFile.async("string") : "{}";
      const nodeData:jsonNode[] = JSON.parse(jsonData);

      const docxFile = zip.filter((path, _) => path.endsWith(".docx"))[0];
      if (!docxFile) {
        console.error("ERRO ON FILE LOAD: No .docx file found in the package");
      }
      const docxBlob = docxFile ? await docxFile.async("blob") : null;

      // load docx into ghostDiv
      await renderAsync(docxBlob, ghostDiv);

      // read from the ghostDiv
      const tables = ghostDiv.querySelectorAll('article table');
      const nodeMap = new Map()
      const tableNodes = Array.from(tables).map((table, index) => {
        const htmlTable = table as HTMLTableElement;
        const rows = Array.from(htmlTable.rows);
        const rawID = rows[0].cells[0].textContent?.trim() || `noIDError|Table-${index}`;

        // slice from index 1 to capture everything after the ID row
        const contentData = rows.slice(1).map(row =>
          Array.from(row.cells).map(cell => cell.innerHTML)
        );
        const specificNodeData = nodeData.find(node => node.id == rawID );
        
        const output: storyNode = {
          id: rawID,
          data: contentData,
          rowCount: rows.length,
          type:'error',
          next:['error'],
          ...specificNodeData // overwrite the default errors for type & next
        };
        nodeMap.set(rawID, output)
        return output;
      });
      setPassageMap(nodeMap)
      addPassage(tableNodes[0].id)  // DEBUG AUTO ADD THE FIRST ONE
    } catch (error) {
      console.error("Failed to load story nodes from DOCX");

    }

    setFileLoaded(true)
  }


  const bottomRef = useRef<HTMLDivElement>(null);
  const jumpToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }
  useEffect(jumpToBottom, [displayedPassages]);

  return (
    <>
      {/* <Journal
        journalFlags={journalFlags}
        journalEntries={journalEntries}
      ></Journal> */}

      <div id='triColSplit' style={{ display: 'grid', gridTemplateColumns: ' 15vw 70vw 15vw ' }}>
        <div id='leftContent' className='sideCol' style={{}}></div>
        <div id='centerContent'>
          <div style={{ position: 'fixed', top: 0, right: 0 }}>
            <button onClick={() => {
              setJournalEntries({})
              setDisplayedPassages([])
              setFileLoaded(false)
              // DOES NOT RESET THE JOURNAL. 
            }}>Reset ALL</button>
            <button onClick={jumpToBottom}> Jump To Bottom </button>
          </div>
          {!fileLoaded && <div>
            <p>
              Upload your .zip file to begin. It should contain both the .json and the .docx
            </p>
            <input type='file' accept='.zip' onChange={loadStory}></input>
          </div>}

          {
            // fileLoaded && <DOCXNodeViewer nodes={storyNodes} />
          }

          <div>
            {displayedPassages.map((passageID, index) => (
              <>
                {
                  // should pass it:
                  // The ID, the Json data, the passage map. The intent is that inside, it looks up passage content on its own.d
                }
                <PassageBox passageID={passageID} passageMap={passageMap} addPassage={addPassage} setJournalFlags={setJournalFlags} index={index} ></PassageBox>
              </>
            ))}


            <div id='bottomRef' ref={bottomRef} style={{ height: '20vh' }} />
          </div>
        </div>
        <div id='rightContent' className='sideCol' style={{}}></div>
      </div>
    </>
  )
}

export default App
