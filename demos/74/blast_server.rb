#!/usr/bin/env ruby

%w[eventmachine em-websocket json].each { |lib| require lib }

host = "127.0.0.1"
port = 8820

module Server
  @sockets = {}

  class << self
    def push ws
      @sockets[ws] = nil
    end

    def delete ws
      @sockets.delete ws
      match = @sockets[ws]

      return if !match
      match.close
      @sockets.delete match
    end

    def available_sockets
      @sockets.select { |_, v| !v }
    end

    def find_match ws
      match = available_sockets.first

      return if !(match && match.first && match.first != ws)

      seed = (Time.now.to_f * 1000).to_i
      match = match.first
      match_socket ws, match
      [ws, match].each { |socket| socket.send({:connect => 1, :seed => seed}.to_json) }
    end

    def match_socket ws, match
      @sockets[match] = ws
      @sockets[ws] = match
    end

    def message ws, msg
      match = @sockets[ws]

      match && match.send({:tick => 1, :input => msg}.to_json)
    end
  end
end

EventMachine.run do
  EventMachine::WebSocket.start :host => host, :port => port, :debug => true do |ws|
    ws.onopen do
      Server.push ws
      Server.find_match ws
    end

    ws.onmessage do |msg|
      Server.message ws, msg
    end

    ws.onclose do
      Server.delete ws
    end

    ws.onerror do
    end
  end
end
