const input=document.getElementById('imageInput'),preview=document.getElementById('preview'),previewImage=document.getElementById('previewImage'),fileName=document.getElementById('fileName'),dropArea=document.getElementById('dropArea');function showImage(file){if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=e=>{previewImage.src=e.target.result;fileName.textContent=file.name;preview.hidden=false};reader.readAsDataURL(file)}input.addEventListener('change',e=>showImage(e.target.files[0]));document.getElementById('removeImage').addEventListener('click',()=>{input.value='';previewImage.removeAttribute('src');preview.hidden=true});document.getElementById('tipsButton').addEventListener('click',()=>{const tips=document.getElementById('tips');tips.hidden=!tips.hidden;document.getElementById('tipsButton').textContent=tips.hidden?'Consejos para la foto':'Ocultar consejos'});['dragenter','dragover'].forEach(name=>dropArea.addEventListener(name,e=>{e.preventDefault();dropArea.classList.add('dragover')}));['dragleave','drop'].forEach(name=>dropArea.addEventListener(name,e=>{e.preventDefault();dropArea.classList.remove('dragover')}));dropArea.addEventListener('drop',e=>showImage(e.dataTransfer.files[0]));
    
// Enviar fotografía al backend
input.addEventListener("change", async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch("http://localhost:3000/api/identify", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al enviar la imagen");
        }

        console.log("Respuesta del backend:", result);
        alert("¡Fotografía enviada correctamente!");
        
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo enviar la fotografía: " + error.message);
    }
});
