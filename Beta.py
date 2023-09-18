from selenium import webdriver
from selenium.webdriver.common.by import By
import json
import re


# Đọc tệp JSON 'sitemap.json'
with open('sitemap.json', 'r') as sitemap_file:
    sitemap_data = json.load(sitemap_file)

# Lấy thông tin 'startUrl' từ dữ liệu sitemap
startUrl = sitemap_data.get('startUrl', '')
print(startUrl)
# Khởi tạo trình duyệt
driver = webdriver.Chrome()

# Hàm xử lý SelectorText


def handle_selector_text(config_item, driver):
    if config_item['multiple']:
        values = []
        elements = driver.find_elements(
            By.CSS_SELECTOR, config_item['selector'])
        for element in elements:
            text_content = element.text.strip()
            if config_item['regex']:
                regex_str = config_item['regex']
                if regex_str:
                    matches = re.search(regex_str, text_content, re.I)
                    if matches:
                        values.append(matches.group())
            else:
                values.append(text_content)
        return {
            'id': config_item['id'],
            'value': values,
        }
    else:
        element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
        text_content = element.text.strip()
        if config_item['regex']:
            regex_str = config_item['regex']
            if regex_str:
                matches = re.search(regex_str, text_content, re.I)
                if matches:
                    text_content = matches.group()
        return {
            'id': config_item['id'],
            'value': text_content,
        }

# Hàm xử lý SelectorLink


def handle_selector_link(config_item, driver):
    if config_item['multiple']:
        values = []
        elements = driver.find_elements(By.CSS_SELECTOR,
                                        config_item['selector'])
        for element in elements:
            href = element.get_attribute('href')
            if href and config_item['hostname'] in href:
                values.append(href)
        return {
            'id': config_item['id'],
            'value': values,
        }
    else:
        element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
        href = element.get_attribute('href')
        return {
            'id': config_item['id'],
            'value': href,
        }


# Truy cập URL 'start_url'
if startUrl:
    driver.get(startUrl)

    # Lặp qua các selector và trích xuất dữ liệu
    extracted_data = {}
    selectors = sitemap_data.get('selectors', [])

    for selector in selectors:
        selector_type = selector.get('type', '')
        selector_config = selector.get('config', {})

        if selector_type == 'text':
            result = handle_selector_text(selector_config, driver)
            extracted_data[result['id']] = result['value']
        elif selector_type == 'link':
            result = handle_selector_link(selector_config, driver)
            extracted_data[result['id']] = result['value']
        # Thêm các trường hợp xử lý cho các loại dữ liệu khác ở đây

    # In dữ liệu trích xuất
    print(extracted_data)

    # Đóng trình duyệt
    driver.quit()
else:
    print("Không tìm thấy URL khởi đầu (startUrl) trong tệp JSON.")
