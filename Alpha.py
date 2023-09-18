from selenium import webdriver
import json
from selenium.webdriver.common.by import By
import re


# Load sitemap từ tệp JSON
with open('sitemap.json', 'r') as sitemap_file:
    sitemap = json.load(sitemap_file)


# Khởi tạo trình duyệt
driver = webdriver.Chrome()


# Hàm xử lý SelectorText
def handle_selector_text(config_item):
    if config_item['multiple']:
        values = []
        elements = driver.find_elements(By.CSS_SELECTOR,
                                        config_item['selector'])
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
        element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
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


# # Hàm xử lý SelectorLink
# def handle_selector_link(config_item):
#     if config_item['multiple']:
#         values = []
#         elements = driver.find_elements(By.CSS_SELECTOR,
#                                         config_item['selector'])
#         for element in elements:
#             href = element.get_attribute('href')
#             if href and href.find(config_item['hostname']) > -1:
#                 values.append(href)
#         return {
#             'id': config_item['id'],
#             'value': values,
#         }
#     else:
#         element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
#         href = element.get_attribute('href')
#         return {
#             'id': config_item['id'],
#             'value': href,
#         }


# # Hàm xử lý SelectorImage
# def handle_selector_image(config_item):
#     if config_item['multiple']:
#         values = []
#         elements = driver.find_elements(By.CSS_SELECTOR,
#                                         config_item['selector'])
#         for element in elements:
#             try:
#                 img_src = element.get_attribute("src") or element.get_attribute(
#                     "data-src") or element.get_attribute("data-lazy")
#                 alt = element.get_attribute(
#                     "alt") or element.get_attribute("data-alt") or ""
#                 if img_src:
#                     values.append({'src': img_src, 'alt': alt})
#             except Exception as e:
#                 print(e)
#         return {
#             'id': config_item['id'],
#             'value': values,
#         }
#     else:
#         element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
#         try:
#             img_src = element.get_attribute("src") or element.get_attribute(
#                 "data-src") or element.get_attribute("data-lazy")
#             alt = element.get_attribute(
#                 "alt") or element.get_attribute("data-alt") or ""
#             if img_src:
#                 return {
#                     'id': config_item['id'],
#                     'value': {'src': img_src, 'alt': alt},
#                 }
#             else:
#                 return {
#                     'id': config_item['id'],
#                     'value': False,
#                 }
#         except Exception as e:
#             print(e)

# # Hàm xử lý SelectorHTML


# def handle_selector_html(config_item):
#     if config_item['multiple']:
#         values = []
#         elements = driver.find_elements(By.CSS_SELECTOR,
#                                         config_item['selector'])
#         for element in elements:
#             if element:
#                 values.append(element.get_attribute('innerHTML'))
#         return {
#             'id': config_item['id'],
#             'value': values,
#         }
#     else:
#         element = driver.find_element(By.CSS_SELECTOR, config_item['selector'])
#         if element:
#             return {
#                 'id': config_item['id'],
#                 'value': element.get_attribute('innerHTML'),
#             }


# Ví dụ sử dụng các hàm
selector_text_config = {
    'id': 'example_text',
    'selector': 'h1',
    'multiple': False,
    'regex': ''
}

# selector_link_config = {
#     'id': 'example_link',
#     'selector': 'a',
#     'multiple': True,
#     'hostname': 'example.com'
# }

# selector_image_config = {
#     'id': 'example_image',
#     'selector': 'img',
#     'multiple': False,
# }

# selector_html_config = {
#     'id': 'example_html',
#     'selector': 'div.content',
#     'multiple': False,
# }

result_text = handle_selector_text(selector_text_config)
# result_link = handle_selector_link(selector_link_config)
# result_image = handle_selector_image(selector_image_config)
# result_html = handle_selector_html(selector_html_config)

print(result_text)
# print(result_link)
# print(result_image)
# print(result_html)

# Đóng trình duyệt
driver.quit()
