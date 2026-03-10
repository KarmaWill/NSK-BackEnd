import { createRoot } from 'react-dom/client'
import './cms.css'
import CMSApp from './CMSApp'

const root = document.getElementById('root')
if (root) createRoot(root).render(<CMSApp />)
