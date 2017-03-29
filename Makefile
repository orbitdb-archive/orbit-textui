all: deps

deps:
	npm install

# test: deps
# 	npm run test
	
# build: test
# 	npm run build
# 	cp dist/orbit.min.js examples/browser/lib
# 	cp node_modules/ipfs-daemon/dist/ipfs-browser-daemon.min.js examples/browser/lib/ipfs-browser-daemon.min.js
# 	@echo "Build success!"
# 	@echo "Output: 'dist/'"

start:
	npm start

clean:
	rm -rf node_modules/
	rm -rf .orbit-textui/

.PHONY: test
