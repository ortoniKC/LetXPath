**LetXPath: Your Ultimate XPath & CSS Selector Finder**

LetXPath is an open-source project designed to help you find XPath and CSS selectors with a single click, complete with code snippets tailored to the element type.

### How to Use LetXPath? 🤔
1. **Install the Extension**: After installation, restart your browser.
2. **Navigate to the Desired Page**: Open the page from which you want to extract XPath.
3. **Open DevTools**: Click on the inspect window or press `F12` (Function `F12`).
4. **Access LetXPath**: Open the LetXPath menu from the sidebar panel.
5. **Get Your XPath**: Click on the desired element to obtain its XPath.

### Features 💭
1. **Single-Click XPath**: Obtain the best XPath with just one click.
2. **Smart XPath Generation**: Generates XPaths based on direct elements or parent-child relationships.
3. **Dynamic XPaths**: Supports dynamic XPaths, including relationships like `following`, `following-sibling`, `preceding`, and `preceding-sibling`.
4. **Axis-Based XPaths**: Creates XPaths based on axes.
5. **User-Enhanced Axes**: Allows enhanced axes XPaths through user selection.

### Using Axes-Based XPath (Parent-Child Relationships) 🎯

LetXPath supports generating axes-based XPath selectors that express relationships between elements using XPath axes like `following::`, `preceding::`, `descendant::`, etc.

#### Method 1: LetXPath Sidebar Buttons (Recommended) ⭐
1. **Open Chrome DevTools** and navigate to the **Elements** panel
2. **Open the LetXPath sidebar** and click on the **"Axes"** tab
3. **Select a parent element** in the Elements panel (`$0`)
4. **Click the "Select Parent ($0)" button** in the LetXPath Axes tab
5. **Select a child element** in the Elements panel
6. **Click the "Select Child ($0)" button** in the LetXPath Axes tab
7. **View the generated axes-based XPath** displayed in the Axes tab

The extension will automatically determine the best axis relationship (`following::`, `preceding::`, `descendant::`, etc.) based on the elements' positions in the DOM.

#### Method 2: Webpage Context Menu (Legacy)
1. Right-click directly on an element in the webpage → Select **"Select Parent"**
2. Right-click on another element in the webpage → Select **"Select Child"**
3. View results in the LetXPath sidebar under the **"Axes"** tab

**💡 Tip**: The sidebar button method is preferred as it provides clear visual feedback and integrates seamlessly with your DevTools workflow.

#### Best Practices for Axes XPath
- Select elements in the order they appear in the document (parent before child)
- The system automatically detects the optimal axis relationship
- If you select elements in reverse order, the system may use `preceding::` axis
- You can reset and start over by selecting a new parent element

### Code Snippets 🎓
1. **XPath with Driver Code**: Provides driver code snippets.
2. **Supported Frameworks**: Currently supports Selenium (Java, Python, C#), Protractor JS, and Playwright (Node & Java).

### Why Choose LetXPath? 🤔
While there are many XPath tools available, LetXPath stands out by not only offering XPaths and snippets but also providing video tutorials on building the entire tool. It’s the only product that shows you how to create the tool itself.

### Get Started
- **Source Code**: [GitHub](https://github.com/ortoniKC/LetXPath)
- **Tutorial**: [Video Tutorial](https://bit.ly/2S3eksW)

### Troubleshooting 😢
If it doesn’t work, restarting your browser should resolve most issues. Feel free to raise any bugs on GitHub.

### Is It Free? 😱
Yes, LetXPath is completely free and always will be.

### What’s in It for You? 🙋
Installing LetXPath brings you the joy of seamless XPath generation and the satisfaction of leaving a 5-star rating.

### Roadmap 😁
Our roadmap is extensive and full of features designed to save you time. Stay tuned for more updates!

Thanks for reading this far! Install LetXPath now and start exploring—you might just fall in love with it. 😉
