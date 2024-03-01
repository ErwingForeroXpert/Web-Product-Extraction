from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/receive_json', methods=['POST'])
def receive_json():
    try:
        data = request.get_json()
        return jsonify(received_data=data, message='JSON received successfully')
    
    except Exception as e:
        return jsonify(error=str(e)), 400

if __name__ == '__main__':
    app.run(debug=True)