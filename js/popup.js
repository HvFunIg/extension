const grabBtn = document.getElementById("grabBtn");
grabBtn.addEventListener("click", ()=>getActiveTab())

/**
 * Получить активную вкладку.
 */
const getActiveTab = () =>{
    //Использование Chrome Tabs API для получения информации о вкладке
    chrome.tabs.query({active: true}, (tabs) => {
        let tab = tabs[0];    //Активная вкладка всегда одна
        if (tab) 
            execScript(tab);        
        else 
            alert("Нет активных вкладок")
    })
}

/**
 * Выполнить функцию grabImages() на веб-странице указанной
 * вкладки и во всех ее фреймах
 * @param tab {Tab} Объект вкладки браузера
 */
const execScript = (tab) =>{
      // Использование Chrome Scripting API
      chrome.scripting.executeScript(
        {
            target:{tabId: tab.id, allFrames: true},
            func:grabImages
        },                   // Объект типа ScriptInjection
        onResult             // Callback
    )
}

/**
 * Получить URL-ы от всех изображений на странице
 * @returns Array - массив URL-ов
 */
const grabImages = () =>{
    //Здесь document указывает на удаленную страницу, а не на страницу расширения
    const images = document.querySelectorAll("img");    
    return Array.from(images).map(image=>image.src); 
}

/**
 * Обработка массива URL-ов
 * @param {InjectionResult[]} frames - Массив результатов grabImages
 * @returns 
 */
const onResult = (frames) =>{
    // Если вкладка != веб-страница (а системная)
    if (!frames || !frames.length) { 
        alert("Нельзя получить изображения с этой страницы");
        return;
    }

    // Объединить списки URL из каждого фрейма в один массив
    const imageUrls = frames.map(frame=>frame.result)
                            .reduce((r1,r2)=>r1.concat(r2));
    openImagesPage(imageUrls);
}

/**
 * Открыть новую вкладку браузера со списком изображений
 * @param String[] urls - Массив URL-ов изображений для построения страницы
 */
const openImagesPage = (urls) =>{
    // Использование Chrome Tabs API

    // Создать страницу 
    chrome.tabs.create({"url":"images.html", active:false}, (tab) =>{
        setTimeout(()=>{    //Чтобы вкладка успела загрузить страницу
            //Отправить данные на новую вкладку
            chrome.tabs.sendMessage(tab.id, urls, (resp) => {
                // Сделать ее активной
                chrome.tabs.update(tab.id, {active: true});
            })
        },500)
    })
}

