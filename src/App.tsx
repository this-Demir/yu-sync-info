import Visualizer from './pages/Visualizer'
import Landing from './pages/Landing'
import Docs from './pages/Docs'
import Media from './pages/Media'
import { useRouteStore } from './store/useRouteStore'
import './index.css'

function App() {
  const currentPage = useRouteStore(state => state.currentPage);

  return (
    <>
      {currentPage === 'landing' && <Landing />}
      {currentPage === 'simulator' && <Visualizer />}
      {currentPage === 'docs' && <Docs />}
      {currentPage === 'media' && <Media />}
    </>
  )
}

export default App
