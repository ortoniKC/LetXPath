var searchXPathArray = null;
var recordArray = null;
var recordArrayPOM = null;
var pom = false;
var xpathValue;
var variable;
function searchAll() {
    variable = searchXPathArray[0][0]
    xpathValue = searchXPathArray[0][3];
    let str = gen(searchXPathArray[0][2], xpathValue, variable, false)
    recordArray.push(str);
    str = gen(searchXPathArray[0][2], xpathValue, variable, true)
    recordArrayPOM.push(str)
}
function gen(locator, val, variable, pom) {
    let str = '';
    variable = variable === null ? 'ele' : variable;
    switch (locator.trim()) {
        case "CSS":
            if (pom) {
                str = `@FindBy(how = How.CSS, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.cssSelector("${val}"));`;
            break;
        case "ClassName is unique":
            if (pom) {
                str = `@FindBy(how = How.CLASS_NAME, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.className("${val}"));`;
            break;
        case "Tag Name is unique":
            if (pom) {
                str = `@FindBy(how = How.TAG_NAME, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.tagName("${val}"));`;
            break;
        case "Link Text:":
            if (pom) {
                str = `@FindBy(how = How.LINK_TEXT, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.linkText("${val}"));`;
            break;
        case "Id is unique:":
            if (pom) {
                str = `@FindBy(how = How.ID, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.id("${val}"));`;
            break;
        case "Name is unique:":
            if (pom) {
                str = `@FindBy(how = How.NAME, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.name("${val}"));`;
            break;
        case "Partial Link Text:":
            if (pom) {
                str = `@FindBy(how = How.PARTIAL_LINK_TEXT, using="${val}") private WebElement ${variable};`
            } else str = `WebElement ${variable} = driver.findElement(By.partialLinkText("${val}"));`;
            break;
        default: if (pom) {
            str = `@FindBy(how = How.XPATH, using="${val}") private WebElement ${variable};`
        } else str = `WebElement ${variable} = driver.findElement(By.xpath("${val}"));`;
            break;
    }
    return str;
}