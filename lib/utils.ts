export function getVietnameseSortKey(word: string): string {
    const cleanWord = word.trim().toLowerCase();

    // Vietnamese collation map
    // We replace specific Vietnamese characters with a sortable ASCII sequence.
    // Basic idea:
    // a -> a0
    // à -> a1, á -> a2, ...
    // ă -> a0a (to group near a but distinct?), OR map them to a separate block.
    // "ă" comes after "a" and "à...". 
    // "â" comes after "ă".
    // 
    // Easier approach for simple sorting: map entire alphabet to a fixed width or specific codes.
    // Let's use a replacement strategy.

    // Detailed order:
    // 0: a
    // 1: à
    // 2: á
    // 3: ả
    // 4: ã
    // 5: ạ
    // 6: ă
    // 7: ằ ...

    // We will replace each char with a 2-char code for sorting.
    // a -> 01
    // à -> 02
    // ...
    // This ensures strictly correct order.

    const map: Record<string, string> = {
        ' ': '00',
        '0': '01', '1': '02', '2': '03', '3': '04', '4': '05',
        '5': '06', '6': '07', '7': '08', '8': '09', '9': '10',

        'a': '11', 'à': '12', 'á': '13', 'ả': '14', 'ã': '15', 'ạ': '16',
        'ă': '17', 'ằ': '18', 'ắ': '19', 'ẳ': '20', 'ẵ': '21', 'ặ': '22',
        'â': '23', 'ầ': '24', 'ấ': '25', 'ẩ': '26', 'ẫ': '27', 'ậ': '28',

        'b': '29',
        'c': '30',
        'd': '31',
        'đ': '32',

        'e': '33', 'è': '34', 'é': '35', 'ẻ': '36', 'ẽ': '37', 'ẹ': '38',
        'ê': '39', 'ề': '40', 'ế': '41', 'ể': '42', 'ễ': '43', 'ệ': '44',

        'g': '45',
        'h': '46',
        'i': '47', 'ì': '48', 'í': '49', 'ỉ': '50', 'ĩ': '51', 'ị': '52',
        'k': '53',
        'l': '54',
        'm': '55',
        'n': '56',

        'o': '57', 'ò': '58', 'ó': '59', 'ỏ': '60', 'õ': '61', 'ọ': '62',
        'ô': '63', 'ồ': '64', 'ố': '65', 'ổ': '66', 'ỗ': '67', 'ộ': '68',
        'ơ': '69', 'ờ': '70', 'ớ': '71', 'ở': '72', 'ỡ': '73', 'ợ': '74',

        'p': '75',
        'q': '76',
        'r': '77',
        's': '78',
        't': '79',

        'u': '80', 'ù': '81', 'ú': '82', 'ủ': '83', 'ũ': '84', 'ụ': '85',
        'ư': '86', 'ừ': '87', 'ứ': '88', 'ử': '89', 'ữ': '90', 'ự': '91',

        'v': '92',
        'x': '93',
        'y': '94', 'ỳ': '95', 'ý': '96', 'ỷ': '97', 'ỹ': '98', 'ỵ': '99',
    };

    let result = '';
    for (const char of cleanWord) {
        result += map[char] || char; // Keep unknown chars as is (will likely float to end or mess up slightly, but fine for basic text)
    }
    return result;
}

export function toTitleCase(word: string): string {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function getVietnameseVariations(letter: string): string[] {
    const base = letter.toLowerCase();
    const map: Record<string, string[]> = {
        'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
        'ă': ['ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'],
        'â': ['â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
        'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
        'ê': ['ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
        'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
        'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
        'ô': ['ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ'],
        'ơ': ['ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
        'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
        'ư': ['ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
        'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
        'd': ['d'],
        'đ': ['đ']
    };

    // Return variations if exist, otherwise just the letter itself (and uppercase to be safe if caller needs, but we return lowercase list usually)
    // Actually, let's return lowercase list.
    return map[base] || [base];
}
