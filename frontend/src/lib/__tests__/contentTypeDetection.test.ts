import { detectContentType, isGraphData, analyzeContent } from '../contentTypeDetection'

describe('Content Type Detection', () => {
  describe('detectContentType', () => {
    it('should detect JSON content', () => {
      const jsonContent = '{"name": "test", "value": 123}'
      expect(detectContentType(jsonContent)).toBe('json')
    })

    it('should detect Markdown content', () => {
      const markdownContent = '# Header\n\nThis is **bold** text.\n\n- List item\n- Another item'
      expect(detectContentType(markdownContent)).toBe('markdown')
    })

    it('should detect Markdown with tables', () => {
      const markdownContent = `# Table Example

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |

This is **bold** text.`
      expect(detectContentType(markdownContent)).toBe('markdown')
    })

    it('should detect Markdown with code blocks', () => {
      const markdownContent = `# Code Example

\`\`\`javascript
function hello() {
  console.log("Hello!");
}
\`\`\`

This is some text.`
      expect(detectContentType(markdownContent)).toBe('markdown')
    })

    it('should detect HTML content', () => {
      const htmlContent = '<div><h1>Title</h1><p>Content</p></div>'
      expect(detectContentType(htmlContent)).toBe('html')
    })

    it('should detect text content', () => {
      const textContent = 'This is plain text content.'
      expect(detectContentType(textContent)).toBe('text')
    })

    it('should handle empty content', () => {
      expect(detectContentType('')).toBe('unknown')
      expect(detectContentType('   ')).toBe('text')
    })
  })

  describe('isGraphData', () => {
    it('should identify graph data with nodes and links', () => {
      const graphData = {
        nodes: [{ id: '1', name: 'Node 1' }],
        links: [{ source: '1', target: '2' }]
      }
      expect(isGraphData(graphData)).toBe(true)
    })

    it('should identify graph data with entities and edges', () => {
      const graphData = {
        entities: [{ id: '1', name: 'Entity 1' }],
        edges: [{ from: '1', to: '2' }]
      }
      expect(isGraphData(graphData)).toBe(true)
    })

    it('should not identify non-graph data', () => {
      const nonGraphData = {
        title: 'Document',
        content: 'Some content'
      }
      expect(isGraphData(nonGraphData)).toBe(false)
    })
  })

  describe('analyzeContent', () => {
    it('should analyze JSON graph data correctly', () => {
      const jsonGraphData = JSON.stringify({
        nodes: [{ id: '1', name: 'Node 1' }],
        links: [{ source: '1', target: '2' }]
      })
      
      const result = analyzeContent(jsonGraphData)
      expect(result.type).toBe('json')
      expect(result.isGraphData).toBe(true)
      expect(result.parsedContent).toBeDefined()
    })

    it('should analyze markdown content correctly', () => {
      const markdownContent = '# Header\n\nThis is **bold** text.'
      
      const result = analyzeContent(markdownContent)
      expect(result.type).toBe('markdown')
      expect(result.isGraphData).toBe(false)
      expect(result.rawContent).toBe(markdownContent)
    })
  })
})
