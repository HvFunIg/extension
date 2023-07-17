/**
 * Обработчик открытия новой вкладки
 */
chrome.runtime.onMessage
    .addListener(function(message,sender,sendResponse) { 
        addImagesToContainer(message);               
        sendResponse("OK");     //Отправка ответа
    });

/**
 * Генерирация HTML-разметки списка изображений
 * @param Array urls - Массив путей к изображениям
 */
const addImagesToContainer = (urls) => {
    if (!urls || !urls.length) 
        return;
    const container = document.querySelector(".container");
    urls.forEach(url => addImageNode(container, url))
}

/**
 * Создать div для изображения
 * @param {*} container - div родителя
 * @param {*} url - URL изображения
 */
const addImageNode = (container, url) => {
    const div = document.createElement("div");
    div.className = "imageDiv";
    const img = document.createElement("img");
    img.src = url;
    div.appendChild(img);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("url",url);            
    div.appendChild(checkbox);
    container.appendChild(div)
}

/**
 * Выбор всех изображений при нажатии на "Выбрать все"
 */
document.getElementById("selectAll").addEventListener("change", (e) => {
    const items = document.querySelectorAll(".container input");
    for (let item of items) {
        item.checked = e.target.checked;
    };
});

/**
 * Скачивание архива с выбранными изображениями
 */
document.getElementById("downloadBtn")
        .addEventListener("click", async() =>{
            try{
                const urls = getSelectedUrls();
                const archive = await createArchive(urls);
                downloadArchive(archive);
            }
            catch(err){
                alert(err.message)
            }
        })

/**
 * Получить выбранные URL
 * @returns 
 */
const getSelectedUrls = () => {
    const items = document.querySelectorAll(".container input");
    const urls = Array.from(items)
         .filter(item => item.checked)
         .map(item => item.getAttribute("url"));
    if (!urls || !urls.length)
        throw new Error("Выберите как минимум одно изображение")
    return urls;
}

/**
 * Скачать все изображения и поместить их в архив
 * @param {*} urls 
 */
async function createArchive(urls) {
    //Создать архив
    const zip = new JSZip();        //JSZip - сторонняя библиотека
    for (let index in urls) {
        try {
            const url = urls[index];
            const response = await fetch(url);
            const blob = await response.blob();
            //Добавить в архив
            zip.file(validateImage(index, blob),blob);  
        } catch (err) {
            console.error(err);
        }
    };
    //Заархивировать данные
    return zip.generateAsync({
        type:'blob',
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
    });
}

/**
 * Скачать архив на устройство
 * @param {*} archive - архив
 */
function downloadArchive(archive) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(archive);
    link.download = "images.zip";        
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
}

/**
 * Проверка валидности изображения
 * @param Number index - номер изображения
 * @param {*} blob - файл изображения
 * @returns 
 */
function validateImage(index, blob) {
    let name = parseInt(index)+1;
    const [type, extension] = blob.type.split("/");
    if (type != "image" || blob.size <= 0) {
        throw Error("Incorrect content");
    }
    return name+"."+extension;
}