import mjml2html from 'mjml';
import path from 'path';
import fs from 'fs/promises';

export async function renderMjmlTemplate(templateName: string, variables: Record<string, any>) {
  const templatePath = path.resolve(__dirname, 'templates', `${templateName}.mjml`);
  
  const mjmlContent = await fs.readFile(templatePath, 'utf-8');


  const compiledMjml = Object.entries(variables).reduce((acc, [key, value]) => {
    const safeKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); 
    const regex = new RegExp(`{{\\s*${safeKey}\\s*}}`, 'g');        
    return acc.replace(regex, String(value));
  }, mjmlContent);

  // Convert MJML to HTML and minify
  const { html, errors } = mjml2html(compiledMjml);

  if (errors.length > 0) {
    errors.forEach(e => console.error(`MJML Error: ${e.formattedMessage}`));
    throw new Error('MJML template compilation error');
  }

  return html;
}
