import fileUrls from './large-file.txt?split';

console.log('Split URLs:', fileUrls);

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <h1>Split Assets Result</h1>
  <p>Original file was split into <strong>${fileUrls.length}</strong> chunks.</p>
  <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px;">${JSON.stringify(fileUrls, null, 2)}</pre>
  
  <h2>Verification</h2>
  <ul id="checklist"></ul>
  
  <h2>Reconstructed Content</h2>
  <textarea id="output" style="width: 100%; height: 200px;" readonly></textarea>
`;

async function verifyChunks() {
    const checklist = document.getElementById('checklist')!;
    const output = document.getElementById('output') as HTMLTextAreaElement;
    let fullContent = '';

    for (const url of fileUrls) {
        const li = document.createElement('li');
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const text = await res.text();
            fullContent += text;
            
            li.innerHTML = `<span style="color: green">✅</span> <strong>${url}</strong> <span style="color: #666">(${text.length} bytes)</span>`;
        } catch (e) {
            console.error(e);
            li.innerHTML = `<span style="color: red">❌</span> <strong>${url}</strong> <span style="color: red">(Failed: ${e})</span>`;
        }
        checklist.appendChild(li);
    }
    
    output.value = fullContent;
}

verifyChunks();
