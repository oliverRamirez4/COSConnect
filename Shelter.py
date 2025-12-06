class Shelter:

    def __init__(self, title, bio, numTotBeds, numOpenBeds):
        self.title = title
        self.bio = bio
        self.numTotBeds = numTotBeds
        self.numOpenBeds = numOpenBeds

    def setTitle(self, title):
        self.title = title

    def getTitle(self):
        return self.title
    
    def setBio(self, bio):
        self.bio = bio

    def getBio(self):
        return self.bio
    
    def setNumTotBeds(self, numTotBeds):
        self.numTotBeds = numTotBeds

    def getNumTotBeds(self):
        return self.numTotBeds
    
    def setNumOpenBeds(self, numOpenBeds):
        self.numOpenBeds = numOpenBeds

    def getNumOpenBeds(self):
        return self.numOpenBeds
    
    def addOpenBeds(self, numBeds):
        self.numOpenBeds += numBeds

    def removeOpenBeds(self, numBeds):
        self.numOpenBeds -= numBeds
    



    


    
