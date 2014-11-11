function getParameterByName(name, searchString) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(searchString);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}