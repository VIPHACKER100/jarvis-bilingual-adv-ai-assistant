# Dangerous commands requiring confirmation
DANGEROUS_COMMANDS = {
    'shutdown', 'restart', 'sleep', 'hibernate',
    'delete', 'remove', 'format', 'uninstall',
    'band karo', 'shutdown karo', 'pc band', 'computer band',
    'delete karo', 'remove karo', 'format karo'
}

# Bilingual command mappings (Hindi -> English)
HINDI_COMMANDS = {
    # Power
    'shutdown': ['shutdown', 'band karo', 'band kijiye', 'band kardo', 'pc band', 'computer band', 'system band', 'शटडाउन', 'बंद करो', 'कंप्यूटर बंद करो', 'सिस्टम बंद करो', 'पीसी बंद करो'],
    'restart': ['restart', 'dobara shuru', 'fir se chalu', 'reboot', 'restart karo', 'restart kardo', 'रीस्टार्ट', 'दोबारा शुरू', 'दोबारा चालू', 'फिर से चालू', 'रिबूट'],
    'sleep': ['sleep', 'sone do', 'suspend', 'sleep mode', 'स्लीप', 'सोने दो'],
    
    # Volume
    'volume_up': [
        'volume up', 'aawaz badhao', 'awaz badhao', 'tez karo', 'sound badhao', 'volume badao', 'volume zyada karo', 'aawaz tez karo',
        'आवाज़ बढ़ाओ', 'आवाज बढ़ाओ', 'वॉल्यूम बढ़ाओ', 'तेज़ करो', 'तेज करो', 'साउंड बढ़ाओ', 
        # English synonyms
        'increase volume', 'increase sound', 'increase audio',
        'raise volume', 'raise sound', 'raise audio',
        'louder', 'sound up', 'audio up', 'turn up volume', 'turn up sound',
    ],
    'volume_down': [
        'volume down', 'aawaz kam karo', 'awaz kam karo', 'dheere karo', 'sound kam', 'volume ghatao', 'aawaz dheere karo',
        'आवाज़ कम करो', 'आवाज कम करो', 'वॉल्यूम कम करो', 'धीरे करो', 'साउंड कम करो', 'साउंड घटाओ',
        # English synonyms
        'decrease volume', 'decrease sound', 'decrease audio',
        'lower volume', 'lower sound', 'lower audio', 'reduce volume', 'reduce sound',
        'quieter', 'sound down', 'audio down', 'turn down volume', 'turn down sound',
    ],
    'mute': [
        'mute', 'silent', 'khamosh', 'unmute', 'aawaz band karo', 'awaz band karo', 'mute kardo',
        'म्यूट', 'खामोश', 'चुप रहो', 'साइलेंट', 'आवाज़ बंद करो', 'आवाज बंद करो',
        # English synonyms
        'silence', 'no sound', 'toggle mute', 'mute audio', 'mute sound', 'mute volume',
    ],
    
    # System
    'time': ['time', 'samay', 'samay kya hai', 'time kya hai', 'baje kya hue', 'kitne baje hai', 'kya time', 'समय', 'समय क्या है', 'क्या समय हुआ है', 'कितने बजे हैं', 'कितने बजे है'],
    'date': ['date', 'tareekh', 'din', 'aaj ka din', 'date kya hai', 'kya date', 'तारीख', 'क्या तारीख है', 'आज कौन सा दिन है', 'दिन क्या है'],
    'battery': ['battery', 'charge', 'power', 'kitni charge hai', 'battery kitni', 'charge kitna', 'बैटरी', 'कितनी चार्ज है', 'बैटरी प्रतिशत', 'बैटरी कितनी है'],
    'system_status': ['system status', 'pc status', 'computer status', 'system check', 'kaisa chal raha hai', 'सिस्टम स्टेटस', 'कंप्यूटर स्टेटस', 'सिस्टम चेक', 'पीसी स्टेटस'],
    
    # Apps
    'open_app': ['open', 'kholo', 'start karo', 'chalu karo', 'khol do', 'run karo', 'start kardo', 'chalao', 'kholiye', 'खोलें', 'खोलो', 'चालू करो', 'स्टार्ट करो', 'चलाओ'],
    'close_app': ['close', 'band karo', 'exit', 'quit', 'band kardo', 'hatao', 'हटाओ', 'बंद करो', 'एग्जिट', 'क्विट', 'निकलो'],
    
    # Window
    'minimize': ['minimize', 'chhota karo', 'niche karo', 'minimize kardo', 'मिनिमाइज', 'छोटा करो', 'नीचे करो'],
    'maximize': ['maximize', 'bada karo', 'pura screen', 'maximize kardo', 'मैक्सिमाइज', 'बड़ा करो', 'पूरी स्क्रीन'],
    'close_window': ['close window', 'window band', 'band karo', 'window hatao', 'विंडो बंद करो', 'खिड़की बंद करो'],
    
    # WhatsApp
    'whatsapp_message': ['whatsapp', 'message bhejo', 'msg bhejo', 'whatsapp karo', 'whatsapp bhjeo', 'send message', 'sandesh bhejo', 'व्हाट्सएप', 'मैसेज भेजो', 'संदेश भेजो', 'व्हाट्सएप मैसेज'],
    'whatsapp_call': ['call', 'phone karo', 'baat karo', 'call lagao', 'whatsapp call', 'कॉल करो', 'फ़ोन करो', 'फोन करो', 'बात करो', 'व्हाट्सएप कॉल'],
    'whatsapp_draft_reply': ['draft a reply', 'reply draft', 'draft reply', 'draft answer', 'smart reply', 'uttar likho', 'reply likho', 'jawab likho', 'reply dhoondo', 'उत्तर लिखो', 'जवाब लिखो', 'रिप्लाई ड्राफ्ट', 'स्मार्ट रिप्लाई'],
    
    # Input
    'move_cursor': ['move cursor', 'cursor move', 'mouse move', 'pointer move', 'कर्सर मूव', 'माउस मूव', 'कर्सर घुमाओ'],
    'click': ['click', 'press', 'select', 'choose', 'click karo', 'क्लिक', 'दबाओ', 'चुनो'],
    'double_click': ['double click', 'do bar click', 'double press', 'डबल क्लिक', 'दो बार क्लिक', 'दो बार दबाएं', 'दो बार दबाओ'],
    'right_click': ['right click', 'context menu', 'options', 'right click karo', 'राइट क्लिक', 'ऑप्शंस दिखाओ'],
    'scroll_up': ['scroll up', 'upar scroll', 'up scroll', 'upar karo', 'ऊपर स्क्रॉल', 'ऊपर जाओ'],
    'scroll_down': ['scroll down', 'neeche scroll', 'down scroll', 'niche karo', 'नीचे स्क्रॉल', 'नीचे जाओ'],
    'type_text': ['type', 'likho', 'enter', 'input', 'type karo', 'लिखो', 'टाइप करो', 'टाइप'],
    'press_key': ['press', 'daba', 'click key', 'press karo', 'दबाओ'],
    'hotkey': ['hotkey', 'shortcut', 'combination', 'saath dabao', 'शॉर्टकट', 'हॉटकी', 'साथ दबाओ'],
    
    # Desktop
    'show_desktop': ['show desktop', 'desktop dikhavo', 'sab band karo', 'desktop show', 'डेस्कटॉप दिखाओ', 'सब बंद करो', 'सब कुछ बंद करो'],
    'snap_left': ['snap left', 'left side', 'bayan taraf', 'left karo', 'स्नैप लेफ्ट', 'बाईं तरफ', 'बायें तरफ', 'बाएं तरफ'],
    'snap_right': ['snap right', 'right side', 'dayan taraf', 'right karo', 'स्नैप राइट', 'दायीं तरफ', 'दायें तरफ', 'दाएं तरफ'],
    
    # Phase 3: File Manager
    'open_folder': ['open folder', 'folder kholo', 'directory kholo', 'explore', 'folder open karo', 'folder chalao', 'फोल्डर खोलो', 'फ़ोल्डर खोलो', 'डायरेक्टरी खोलो', 'फोल्डर ओपन करो'],
    'open_downloads': ['open downloads', 'open download', 'downloads kholo', 'download folder', 'downloads', 'download', 'download dikhao', 'डाउनलोड ओपन करो', 'डाउनलोड्स खोलो', 'डाउनलोड'] ,
    'open_documents': ['open downloads', 'open document', 'documents kholo', 'docs kholo', 'documents', 'document', 'docs', 'डॉक्युमेंट्स खोलो', 'डॉक्यूमेंट ओपन करो'],
    'open_desktop': ['open desktop', 'desktop kholo', 'desktop', 'desktop foldero', 'डेस्कटॉप खोलो', 'डेस्कटॉप'],
    'open_pictures': ['open pictures', 'open picture', 'pictures kholo', 'photos kholo', 'pictures', 'picture', 'photos', 'photo', 'पिक्चर्स खोलो', 'फोटो खोलो'],
    'open_videos': ['open videos', 'open video', 'videos kholo', 'movies kholo', 'videos', 'video', 'movies', 'movie', 'वीडियो खोलो', 'मूवी खोलो'],
    'open_music': ['open music', 'music kholo', 'gaane kholo', 'music', 'songs', 'gaane', 'म्यूजिक खोलो', 'गाने खोलो'],
    'open_home': ['open home', 'home kholo', 'home directory', 'home folder', 'home', 'main folder', 'home dikhao', 'होम खोलो'],
    'search_files': ['search file', 'file dhoondo', 'find file', 'dhundho', 'search karo', 'file kya hai', 'फ़ाइल ढूंढो', 'फाइल ढूंढो', 'खोजो', 'सर्च करो', 'फाइल सर्च करो'],
    'create_folder': ['create folder', 'naya folder', 'new folder', 'folder banao', 'folder banaiye', 'नया फोल्डर', 'नया फोल्डर बनाओ', 'फोल्डर क्रिएट करो'],
    'delete_file': ['delete file', 'file hatao', 'remove file', 'delete karo', 'hatao', 'delete kardo', 'khatam karo', 'फ़ाइल हटाओ', 'फाइल डिलीट करो', 'हटाओ', 'डिलीट करो'],
    'copy_file': ['copy file', 'file copy karo', 'duplicate', 'copy kardo', 'कॉपी फ़ाइल', 'फ़ाइल कॉपी करो', 'फाइल कॉपी करो'],
    'move_file': ['move file', 'file move karo', 'shift karo', 'move kardo', 'move करो', 'फाइल स्थानांतरित करो', 'फाइल मूव करो'],
    'rename_file': ['rename file', 'file ka naam badlo', 'naam badlo', 'rename karo', 'नाम बदलो', 'फाइल का नाम बदलो', 'rename करो'],
    
    # Phase 3: Media Processing
    'ocr_image': ['extract text from image', 'image se text nikalo', 'ocr image', 'text nikalo', 'photo padho', 'padh ke batao', 'इमेज से टेक्स्ट निकालो', 'फोटो से टेक्स्ट निकालो', 'टेक्स्ट निकालो'],
    'ocr_pdf': ['extract text from pdf', 'pdf se text nikalo', 'read pdf', 'pdf padho', 'pdf me kya hai', 'पीडीएफ से टेक्स्ट निकालो', 'पीडीएफ पढ़ो'],
    'extract_text': ['extract text', 'text nikalo', 'copy text', 'text copy karo', 'टेक्स्ट निकालो', 'टेक्स्ट कॉपी करो'],
    'convert_image': ['convert image', 'image convert karo', 'format change karo', 'image badlo', 'इमेज कन्वर्ट करो', 'इमेज का फॉर्मेट बदलो'],
    'resize_image': ['resize image', 'image resize karo', 'size badlo', 'chhota karo', 'bada karo size', 'इमेज रिसाइज करो', 'इमेज का साइज बदलो', 'साइज बदलो'],
    'compress_image': ['compress image', 'image compress karo', 'size kam karo', 'compress kardo', 'इमेज कम्प्रेस करो', 'साइज कम करो'],
    'merge_pdfs': ['merge pdfs', 'pdfs jodo', 'combine pdfs', 'pdf merge karo', 'ek karo pdf', 'पीडीएफ मिलाओ', 'पीडीएफ जोड़ो'],
    'pdf_to_images': ['pdf to images', 'pdf ko image \nbanao', 'pdf image me badlo', 'pdf ko images mein convert karo', 'पीडीएफ को इमेज में बदलो'],
    'images_to_pdf': ['images to pdf', 'images ko pdf \nmein convert karo', 'photo se pdf banao', 'इमेज को पीडीएफ में बदलो'],
    
    # Phase 3: Desktop
    'take_screenshot': [
        'take screenshot', 'screenshot lo', 'screen capture karo', 'photo lo', 'screenshot nikal', 'screenshot khicho',
        'स्क्रीनशॉट लो', 'स्क्रीन कैप्चर करो', 'फोटो लो', 'स्क्रीनशॉट खींचो', 'स्क्रीनशॉट खींचिए',
        'कैप्चर करो', 'कैप्चर'
    ],
    'get_clipboard': ['get clipboard', 'clipboard dekhoo', 'copy kiya hua dekhao', 'kya copy kiya', 'क्लिपबोर्ड देखो', 'क्या कॉपी किया है'],
    'set_clipboard': ['set clipboard', 'clipboard mein daalo', 'copy karo', 'क्लिपबोर्ड में डालो', 'कॉपी करो'],
    'media_play': [
        'play media', 'play pause', 'music chalao', 'video chalao', 'gaana chalao', 'resume karo', 'pause karo',
        'मीडिया चलाओ', 'म्यूजिक चलाओ', 'गाना चलाओ', 'वीडियो चलाओ', 'प्ले', 'पॉज', 'रोको', 'चलाओ', 'वीडियो रोको', 'गाना रोको',
        # English natural phrases
        'play music', 'play song', 'play audio', 'play video',
        'start music', 'start playing', 'start song',
        'resume music', 'resume media', 'resume playing',
        'pause music', 'pause song', 'pause media',
        'toggle music', 'toggle media', 'play pause',
    ],
    'media_next': ['next track', 'agla gaana', 'next song', 'next music', 'skip song', 'skip track', 'agla chalao', 'अगला गाना', 'नेक्स्ट ट्रैक', 'अगला', 'आगे वाला गाना', 'आगे बढ़ाओ'],
    'media_previous': ['previous track', 'pichla gaana', 'previous song', 'prev track', 'previous music', 'pichla chalao', 'पिछला गाना', 'पीछे का गाना', 'पिछला', 'पीछे वाला गाना', 'पीछे करो'],
    
    # Advanced Desktop
    'change_wallpaper': ['change wallpaper', 'wallpaper badlo', 'background badlo', 'desktop picture', 'wallpaper change karo', 'वॉलपेपर बदलो', 'बैकग्राउंड बदलो', 'वॉलपेपर चेंज करो'],
    'empty_recycle_bin': ['empty recycle bin', 'recycle bin khali karo', 'trash saaf karo', 'kachra saaf karo', 'delete sab kuch', 'रीसायकल बिन खाली करो', 'रिसाइकिल बिन खाली करो', 'कूड़ा साफ करो', 'कचरा साफ करो'],
    'toggle_taskbar': ['toggle taskbar', 'taskbar chhupao', 'taskbar dikhao', 'taskbar hide', 'taskbar show', 'टास्कबार छुपाओ', 'टास्कबार दिखाओ', 'टास्कबार हाइड करो'],
    'zoom_in': ['zoom in', 'screen zoom karo', 'bada dikhao', 'zoom badhao', 'zoom karo', 'ज़ूम इन', 'ज़ूम करो', 'स्क्रीन बड़ी करो', 'बड़ा दिखाओ'],
    'zoom_out': ['zoom out', 'screen zoom kam karo', 'chhota dikhao', 'zoom ghatao', 'zoom kam karo', 'ज़ूम आउट', 'ज़ूम कम करो', 'छोटा दिखाओ'],
    
    # Advanced Media
    'batch_pdf': ['images to pdf', 'sare photo pdf banao', 'folder pdf banao', 'batch pdf', 'sabka pdf banao', 'सारी फोटो पीडीएफ बनाओ', 'फोल्डर पीडीएफ बनाओ', 'सभी इमेज की पीडीएफ बनाओ'],
    'scan_folder': ['scan folder', 'folder scan karo', 'file dhoondo folder mein', 'folder dekho', 'फोल्डर स्कैन करो', 'फोल्डर में ढूंढो'],
    'make_drawing': ['make drawing', 'drawing banao', 'paint kholo', 'sketch banao', 'paint chalao', 'ड्राइंग बनाओ', 'पेंट खोलो', 'स्केच बनाओ'],
    'get_selected_text': ['get selected text', 'select kiya hua text', 'selected text padho', 'text copy karo selection se', 'kya select kiya', 'सेलेक्ट किया हुआ टेक्स्ट', 'चुना हुआ टेक्स्ट पढ़ो', 'सेलेक्टेड टेक्स्ट'],
    
    # Search & Browser
    'google_search': ['search', 'google search', 'dhoondo', 'dhundo', 'pata karo', 'khojo', 'search karo', 'baar mein batao', 'सर्च', 'गूगल सर्च', 'ढूंढो', 'पता करो', 'खोजो', 'सर्च करो'],
    'open_browser': ['open browser', 'browser kholo', 'open new', 'new tab', 'naya tab', 'internet kholo', 'chrome kholo', 'edge kholo', 'ब्राउज़र खोलो', 'ब्राउज़र खोलो', 'नया टैब', 'नया टैब खोलो', 'इंटरनेट खोलो'],
}
