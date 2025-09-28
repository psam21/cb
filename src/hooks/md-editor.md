# Next.js Markdown Editor Integration Instructions

## Objective
Add markdown editing capabilities to any form in our Next.js + Tailwind CSS site hosted on Vercel.

## Step 1: Install Required Package
```bash
npm install @uiw/react-md-editor
```

## Step 2: Import CSS in _app.js
Add this import to your `pages/_app.js` or `app/layout.js`:
```javascript
import '@uiw/react-md-editor/markdown-editor.css';
```

## Step 3: Create Reusable Markdown Editor Component
Create `components/MarkdownEditor.js`:
```javascript
import MDEditor from '@uiw/react-md-editor';

export default function MarkdownEditor({ 
  value, 
  onChange, 
  height = 300, 
  placeholder = "Write your content here..." 
}) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <MDEditor
        value={value}
        onChange={onChange}
        height={height}
        data-color-mode="light"
        placeholder={placeholder}
      />
    </div>
  );
}
```

## Step 4: Usage in Any Form
Replace any `<textarea>` with the markdown editor:

### Basic Form Example:
```javascript
import { useState } from 'react';
import MarkdownEditor from '../components/MarkdownEditor';

export default function MyForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // formData.content and formData.description now contain markdown
    console.log('Form data:', formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Replace textarea with markdown editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Content
          </label>
          <MarkdownEditor
            value={formData.content}
            onChange={(val) => setFormData({...formData, content: val || ''})}
            height={400}
            placeholder="Write your main content..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <MarkdownEditor
            value={formData.description}
            onChange={(val) => setFormData({...formData, description: val || ''})}
            height={200}
            placeholder="Write a description..."
          />
        </div>
        
        <button 
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
```

## Step 5: Integration with Existing Forms

### For React Hook Form:
```javascript
import { useForm, Controller } from 'react-hook-form';
import MarkdownEditor from '../components/MarkdownEditor';

export default function FormWithValidation() {
  const { control, handleSubmit } = useForm();
  
  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="content"
        control={control}
        rules={{ required: 'Content is required' }}
        render={({ field }) => (
          <MarkdownEditor
            value={field.value || ''}
            onChange={field.onChange}
            height={300}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Step 6: Customization Options

### Toolbar Options:
```javascript
<MarkdownEditor
  value={content}
  onChange={setContent}
  hideToolbar={true}  // Hide toolbar for simple editing
  visibleDragBar={false}  // Hide drag bar
  preview="edit"  // Options: 'live', 'edit', 'preview'
/>
```

### Size Variants:
```javascript
// Small editor for comments
<MarkdownEditor height={150} />

// Medium for descriptions  
<MarkdownEditor height={300} />

// Large for full articles
<MarkdownEditor height={500} />
```

## Step 7: Deployment Notes
- No special Vercel configuration needed
- The component works with SSR out of the box
- CSS is automatically included in the build
- Deploy normally with `vercel --prod`

## Optional: Preview Component
If you need to display rendered markdown:
```bash
npm install react-markdown
```

```javascript
import ReactMarkdown from 'react-markdown';

function MarkdownPreview({ content }) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

## Testing Checklist
- [ ] Editor loads without errors
- [ ] Typing works in editor
- [ ] Preview pane updates in real-time
- [ ] Form submission includes markdown content
- [ ] Styling looks good with Tailwind
- [ ] Works on mobile devices
- [ ] Deploys successfully to Vercel

## Support
This is a widely-used, stable library. If you encounter issues:
1. Check the [official documentation](https://uiwjs.github.io/react-md-editor/)
2. Ensure CSS import is in the correct location
3. Verify React version compatibility (works with React 16.8+)
