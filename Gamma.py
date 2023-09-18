from selenium import webdriver
from selenium.webdriver.common.by import By
import json
import re
import time
import traceback


# Đọc tệp JSON 'sitemap.json'
with open('sitemap.json', 'r') as sitemap_file:
    sitemap_data = json.load(sitemap_file)

# Lấy thông tin 'startUrl' từ dữ liệu sitemap
startUrls = sitemap_data.get('startUrl', [])
if len(startUrls) > 0:
    startUrl = startUrls[0]
else:
    startUrl = ''

# Kiểm tra xem startUrl có giá trị hợp lệ không
if not startUrl:
    print("Không tìm thấy URL khởi đầu (startUrl) trong tệp JSON.")
else:
    # Khởi tạo trình duyệt
    driver = webdriver.Chrome()
    driver.get(startUrl)
    time.sleep(2)

    # Hàm xử lý SelectorText
    def handle_selector_text(config_item, driver):
        if config_item['multiple']:
            values = []
            elements = driver.find_elements(
                By.CSS_SELECTOR, config_item['selector'])
            for element in elements:
                text_content = element.text.strip()
                if config_item['regex']:
                    regex_str = re.compile(config_item['regex'], re.I)
                    matches = regex_str.search(text_content)
                    if matches:
                        values.append(matches.group())
                else:
                    values.append(text_content)
            return {
                'id': config_item['id'],
                'value': values,
            }
        else:
            element = driver.find_element(
                By.CSS_SELECTOR, config_item['selector'])
            text_content = element.text.strip()
            if config_item['regex']:
                regex_str = re.compile(config_item['regex'], re.I)
                matches = regex_str.search(text_content)
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
        elements = driver.find_elements(
            By.CSS_SELECTOR, config_item['selector'])
        for element in elements:
            href = element.get_attribute('href')
            if href and href.find(config_item.get('hostname', '')) > -1:
                values.append(href)
        return {
            'id': config_item['id'],
            'value': values,
        }
    else:
        element = driver.find_element(
            By.CSS_SELECTOR, config_item['selector'])
        href = element.get_attribute('href')
        return {
            'id': config_item['id'],
            'value': href,
        }

    # Hàm xử lý SelectorImage
    def handle_selector_image(config_item, driver):
        if config_item['multiple']:
            values = []
            elements = driver.find_elements(
                By.CSS_SELECTOR, config_item['selector'])
            for element in elements:
                try:
                    img_src = element.get_attribute("src") or element.get_attribute(
                        "data-src") or element.get_attribute("data-lazy")
                    alt = element.get_attribute(
                        "alt") or element.get_attribute("data-alt") or ""
                    if img_src:
                        values.append({'src': img_src, 'alt': alt})
                except Exception as e:
                    print(e)
            return {
                'id': config_item['id'],
                'value': values,
            }
        else:
            element = driver.find_element(
                By.CSS_SELECTOR, config_item['selector'])
            try:
                img_src = element.get_attribute("src") or element.get_attribute(
                    "data-src") or element.get_attribute("data-lazy")
                alt = element.get_attribute(
                    "alt") or element.get_attribute("data-alt") or ""
                if img_src:
                    return {
                        'id': config_item['id'],
                        'value': {'src': img_src, 'alt': alt},
                    }
                else:
                    return {
                        'id': config_item['id'],
                        'value': False,
                    }
            except Exception as e:
                error_message = str(e)
                traceback.print_exc()

    # Xử lý tất cả các selectors trong sitemap
    extracted_data = {}
    selectors = sitemap_data.get('selectors', [])
    for selector in selectors:
        selector_type = selector.get('type', '')
        selector_config = selector.get('config', {})
        multiple = selector_config.get('multiple', False)

        if selector_type == 'SelectorText':
            result = handle_selector_text(selector_config, driver)
            extracted_data[result['id']] = result['value']
        elif selector_type == 'SelectorLink':
            result = handle_selector_link(selector_config, driver)
            extracted_data[result['id']] = result['value']
        elif selector_type == 'SelectorImage':
            result = handle_selector_image(selector_config, driver)
            extracted_data[result['id']] = result['value']

    # In dữ liệu trích xuất
    print(extracted_data)

    # Đóng trình duyệt
    driver.quit()
