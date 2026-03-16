import sys

with open(r'c:\Users\Victor Andre\Desktop\altos articulos sistema\admin\app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "config: 'Configuración',\n        temas: 'Temas de Colores',\n        bodysection: 'Imágenes Body Section'\n    };", 
    "config: 'Configuración',\n        temas: 'Temas de Colores',\n        bodysection: 'Imágenes Body Section',\n        'editor-visual': 'Editor Visual en Vivo Wix'\n    };"
)

with open(r'c:\Users\Victor Andre\Desktop\altos articulos sistema\admin\app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
