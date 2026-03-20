import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import StoryViewer from './components/StoryViewer/StoryViewer'
import StoryEditor from './components/StoryEditor/StoryEditor'
import { ReactFlowProvider } from '@xyflow/react'

function App() {
  return <>
    <BrowserRouter>
      <nav>
        <Link to="/"> StoryViewer </Link>
        <Link to="/Editor"> StoryEditor </Link>
      </nav>

      <Routes>
        <Route path='/' element={<StoryViewer />} />
        <Route path='/Editor' element={
          <ReactFlowProvider>
            <StoryEditor />
          </ReactFlowProvider>
        } />
      </Routes>

    </BrowserRouter>

  </>
}

export default App
