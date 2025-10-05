import { render, screen } from '@testing-library/react'
import { ContentRenderer } from '../ContentRenderer'

describe('ContentRenderer', () => {
  it('should render markdown content with react-markdown', () => {
    const markdownContent = `# Test Header

This is **bold** text and *italic* text.

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

- List item 1
- List item 2

[Link to example](https://example.com)
`

    render(
      <ContentRenderer
        contentType="markdown"
        content={markdownContent}
        isGraphData={false}
      />
    )

    // Check if the header is rendered
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Header')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Code Example')

    // Check if bold and italic text are rendered
    expect(screen.getByText('bold')).toHaveClass('font-bold')
    expect(screen.getByText('italic')).toHaveClass('italic')

    // Check if the link is rendered
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByRole('link')).toHaveTextContent('Link to example')

    // Check if list items are rendered
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
    expect(listItems[0]).toHaveTextContent('List item 1')
    expect(listItems[1]).toHaveTextContent('List item 2')
  })

  it('should render JSON content with syntax highlighting', () => {
    const jsonContent = '{"name": "test", "value": 123}'
    const parsedContent = { name: "test", value: 123 }

    render(
      <ContentRenderer
        contentType="json"
        content={jsonContent}
        parsedContent={parsedContent}
        isGraphData={false}
      />
    )

    // Check if the content type badge is shown
    expect(screen.getByText('JSON')).toBeInTheDocument()

    // Check if the formatted JSON is displayed
    expect(screen.getByText('"name"')).toBeInTheDocument()
    expect(screen.getByText('"test"')).toBeInTheDocument()
  })

  it('should render text content as plain text', () => {
    const textContent = 'This is plain text content.'

    render(
      <ContentRenderer
        contentType="text"
        content={textContent}
        isGraphData={false}
      />
    )

    // Check if the content type badge is shown
    expect(screen.getByText('TEXT')).toBeInTheDocument()

    // Check if the text content is displayed
    expect(screen.getByText('This is plain text content.')).toBeInTheDocument()
  })

  it('should show raw view when toggled', () => {
    const markdownContent = '# Test\n\n**Bold text**'

    render(
      <ContentRenderer
        contentType="markdown"
        content={markdownContent}
        isGraphData={false}
      />
    )

    // Initially should show formatted content
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test')

    // Click the raw button
    const rawButton = screen.getByText('Raw')
    rawButton.click()

    // Should now show raw content in textarea
    expect(screen.getByDisplayValue(markdownContent)).toBeInTheDocument()
  })
})
