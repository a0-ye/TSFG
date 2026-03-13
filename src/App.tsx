import { useEffect, useRef, useState } from 'react'
import './App.css'
import PassageBox from './components/PassageBox/PassageBox'
import Journal from './components/Journal/Journal'
import { renderAsync } from 'docx-preview'
import JSZip from 'jszip'

import { ERROR_NODE, type AllNodes, type DataNode, type JournalNode } from './components/NodeTypes'
import type { FlagValue } from './components/utils'

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
  const [fileLoaded, setFileLoaded] = useState(false)
  const [nodeMap, setNodeMap] = useState(new Map<string, AllNodes>()) // A map containing all of the passages as id:node key:val
  const [journalMap, setJournalMap] = useState(new Map<string, JournalNode>()) // map of all journal entries as id:node

  const [flags, setFlags] = useState<Record<string, FlagValue>>({})
  /**
 * Updates Journal Flags with the all flag:value in newFlags.
 * should not contain any operators since this is a flat value update
 * @param newFlags JS object of string: string | number | boolean. 
 */
  function updateFlags(newFlags: Record<string, FlagValue>) {
    setFlags((prev) => ({
      ...prev,
      ...newFlags
    }));
  }
  const [displayedJournalEntries, setDisplayedJournalEntries] = useState<JournalNode[]>([])    // list of nodes. should be based on groupID used to keep track of chronological entries

  /**
   * Runs when the game is restarted. NOT WIPED, but restarted.
   * 
   * Should reset all flags
   * Should remove all non-persistant displayed entries
   */
  function restartRun() {
    setFlags({})
    // filter nodes whose persist flag is true
    setDisplayedJournalEntries((prev) => prev.filter((node) => node.persist === true))
  }

  /**
   * RESETS EVERYTHING. Wipes the slate clean
   */
  function resetAll() {
    setFlags({})
    setDisplayedJournalEntries([])
    setFileLoaded(false)
  }

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
      const nodeData: Record<string, any> = JSON.parse(jsonData);


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
      const journalMap = new Map<string, JournalNode>()

      // Everything is based on the Tables get created first, so if there is JSON data for a non-existent table in the DOCX, no DataNode will ever be created
      const tableNodes = Array.from(tables).map((table, index) => {
        const htmlTable = table as HTMLTableElement;
        const rows = Array.from(htmlTable.rows);
        const rawID = rows[0].cells[0].textContent?.trim() || `noIDError|Table-${index}`;


        // slice from index 1 to capture everything after the ID row
        const contentData = rows.slice(1).map(row =>
          Array.from(row.cells).map(cell => cell.innerHTML)[0]
        );
        const specificNodeData = nodeData.find((node: any) => node.id == rawID); // TODO: fix typing here
        if (specificNodeData?.type == '2') {
          if (rows[2].cells[0].textContent.trim() == '') {
            contentData[1] = contentData[0]
          }
          // other stuff maybe          
        }

        const output: DataNode = {
          ...ERROR_NODE,  // if we cant find anything its just an error
          id: rawID,
          data: contentData,
          rowCount: rows.length,
          ...specificNodeData // overwrite the default errors for type & next
        };
        nodeMap.set(rawID, output)
        if (output.type == '3') {  // add as only journal node
          journalMap.set(rawID, output as JournalNode)
        }
        return output;
      });
      setNodeMap(nodeMap)
      setJournalMap(journalMap)
      addPassage(tableNodes[0].id)  // DEBUG AUTO ADD THE FIRST ONE
    } catch (error) {
      console.error("Failed to load story nodes from DOCX ", error);

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
      <Journal
        flags={flags}
        setFlags={setFlags}
        displayedJournalEntries={displayedJournalEntries}
        setDisplayedJournalEntries={setDisplayedJournalEntries}
        journalMap={journalMap}
      ></Journal>

      <div id='triColSplit' style={{ display: 'grid', gridTemplateColumns: ' 15vw 70vw 15vw ' }}>
        <div id='leftContent' className='sideCol' style={{}}></div>
        <div id='centerContent'>
          <div style={{ position: 'fixed', top: 0, right: 0 }}>
            <button onClick={() => {
              resetAll()
            }}>Reset ALL (wipes progress)</button>
            <button onClick={() => {
              restartRun()
              // DOES NOT RESET THE JOURNAL. 
            }}>Restart Story from Beginning (with progress kept) </button>
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
                <PassageBox
                  passageID={passageID}
                  passageMap={nodeMap}
                  addPassage={addPassage}
                  index={index}
                  flags={flags}
                  updateFlags={updateFlags}
                ></PassageBox>
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
