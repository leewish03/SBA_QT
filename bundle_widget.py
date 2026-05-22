import os

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def bundle_to_single_jsx():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.join(script_dir, "test-app", "src")
    
    css_content = read_file(os.path.join(base_dir, "SBA_QT.css"))
    css_lines = css_content.split('\n')
    imports = [line for line in css_lines if line.startswith('@import')]
    rest_css = '\n'.join([line for line in css_lines if not line.startswith('@import')])

    logic = read_file(os.path.join(base_dir, "utils", "bibleLogic.js"))
    supabase_client = read_file(os.path.join(base_dir, "utils", "supabaseClient.js"))
    bible_storage = read_file(os.path.join(base_dir, "utils", "BibleStorage.js"))
    sync_manager = read_file(os.path.join(base_dir, "utils", "syncManager.js"))
    
    nav = read_file(os.path.join(base_dir, "components", "NavComponents.jsx"))
    tab = read_file(os.path.join(base_dir, "components", "TabComponents.jsx"))
    weekly = read_file(os.path.join(base_dir, "components", "WeeklyAndModals.jsx"))
    reactbits = read_file(os.path.join(base_dir, "components", "ReactBits.jsx"))
    app = read_file(os.path.join(base_dir, "SBA_QT_App.jsx"))
    
    def strip_imports_exports(text):
        lines = []
        for line in text.split('\n'):
            if line.strip().startswith('import '):
                continue
            if line.startswith('export const'):
                line = line.replace('export const', 'const')
            elif line.startswith('export function'):
                line = line.replace('export function', 'function')
            elif line.startswith('export default'):
                line = line.replace('export default', '')
            lines.append(line)
        return '\n'.join(lines)
    
    logic_clean = strip_imports_exports(logic)
    supabase_clean = strip_imports_exports(supabase_client)
    storage_clean = strip_imports_exports(bible_storage)
    sync_clean = strip_imports_exports(sync_manager)
    
    nav_clean = strip_imports_exports(nav)
    tab_clean = strip_imports_exports(tab)
    weekly_clean = strip_imports_exports(weekly)
    reactbits_clean = strip_imports_exports(reactbits)
    
    app_clean = strip_imports_exports(app)
    app_clean = app_clean.replace('<div className={`sba-app-container ${isDark ? \'dark\' : \'\'}`}>', '<SbaStyledWrapper className={`sba-app-container ${isDark ? \'dark\' : \'\'}`}>\n        <GlobalStyle />')
    app_clean = app_clean.replace('</div>\n    );', '</SbaStyledWrapper>\n    );')
    
    mega_bundle = f"""import React, {{ useState, useEffect, useRef, useMemo }} from 'react';
import styled, {{ createGlobalStyle }} from 'styled-components';
import {{ createClient }} from '@supabase/supabase-js';

// ==========================================
// 1. Global Styles & Nested CSS (Styled-components)
// ==========================================
const GlobalStyle = createGlobalStyle`
  {chr(10).join(imports)}
`;

const SbaStyledWrapper = styled.div`
{rest_css}
`;

// ==========================================
// 2. Constants & Logic
// ==========================================
{logic_clean}

// ==========================================
// 3. Supabase & Local Caching Storages
// ==========================================
{supabase_clean}

{storage_clean}

{sync_clean}

// ==========================================
// 4. Components
// ==========================================
{reactbits_clean}

{nav_clean}

{tab_clean}

{weekly_clean}

// ==========================================
// 5. Main Export App
// ==========================================
{app_clean}
"""

    out_path = os.path.join(script_dir, "SBA_QT_Widget.jsx")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(mega_bundle)
    print("Bundle created perfectly!")

if __name__ == "__main__":
    bundle_to_single_jsx()
