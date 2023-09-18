from selenium import webdriver
from selenium.webdriver.common.by import By
import json
import re
import time
import traceback


def auto_scroll(driver):
    total_height = 0
    distance = 250
    while total_height < 1100:
        driver.execute_script("window.scrollBy(0, arguments[0]);", distance)
        total_height += distance
        time.sleep(0.1)


# def handle_selector_text(config_item, driver):
#     element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
#     text = element.text
#     return {
#         # Kiểm tra nếu 'id' không tồn tại, gán một giá trị mặc định là ''
#         'id': config_item.get('id', ''),
#         'value': text,
#     }


def handle_selector_link(config_item, driver):
    if 'multiple' in config_item:
        if config_item.multiple:
            values = []
            elements = driver.find_elements(
                By.CSS_SELECTOR, config_item['selector'])
            for element in elements:
                href = element.get_attribute('href')
                if href:
                    values.append(href)
            return {
                # Kiểm tra nếu 'id' không tồn tại, gán một giá trị mặc định là ''
                'id': config_item.get('id', ''),
                'value': values,
            }
        else:
            element = driver.find_element(
                By.CSS_SELECTOR, config_item['selector'])
            href = element.get_attribute('href')
            return {
                # Kiểm tra nếu 'id' không tồn tại, gán một giá trị mặc định là ''
                'id': config_item.get('id', ''),
                'value': href,
            }
    else:
        return {
            # Kiểm tra nếu 'id' không tồn tại, gán một giá trị mặc định là ''
            'id': config_item.get('id', ''),
            'value': None,
        }


# Đọc tệp JSON 'sitemap.json'
with open('sitemap.json', 'r') as sitemap_file:
    sitemap_data = json.load(sitemap_file)


# Lấy danh sách các trang bắt đầu từ 'startUrl'
startUrls = sitemap_data.get('startUrl', [])
if len(startUrls) > 0:
    for startUrl in startUrls:
        # Khởi tạo trình duyệt
        driver = webdriver.Chrome()
        driver.get(startUrl)
        time.sleep(2)

        extracted_data = {}
        selectors = sitemap_data.get('selectors', [])
        for selector in selectors:
            selector_type = selector.get('type', '')
            selector_config = selector.get('config', {})

            if selector_type == 'SelectorLink':
                result = handle_selector_link(selector_config, driver)
                extracted_data[result['id']] = result['value']

        # In dữ liệu trích xuất cho từng trang
        print(extracted_data)

        # Đóng trình duyệt
        driver.quit()
else:
    print("Không tìm thấy URL khởi đầu (startUrl) trong tệp JSON.")
